import { Router } from 'express';
import { pool } from '../db/pool.js';
import { JOURNEY_IMAGES_SQL, journeyImages } from '../db/journeyGallery.js';
import { requireAuth } from '../middleware/auth.js';
import {
  badRequest, notFound, conflict, forbidden, asyncHandler,
  isNonEmptyString, isPositiveInt, toCents, centsToDecimalString, newReservationReference,
} from '../util.js';
import {
  RESERVATION_TYPES, SERVICE_TIERS, SERVICE_TIER_IDS, COMFORT_PREFERENCES,
  SCHEDULE_PREFERENCES, PARTY_TYPES, TAX_RATE, SERVICE_FEE_CENTS, CUSTOM_PLANNING_FEE_CENTS,
  tierMultiplier, serviceTier, finalizePricing,
} from '../pricing.js';

export const reservationsRouter = Router();

const MAX_TRAVELLERS = 20;
const MAX_CUSTOM_MEMBERS = 30;

function optionToJson(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    price: row.price,
  };
}

function journeyToJson(row) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    description: row.description,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    durationDays: row.duration_days,
    price: row.price,
    capacity: row.capacity,
    transport: row.transport,
    accommodation: row.accommodation,
    imageUrl: row.image_url,
    images: journeyImages(row),
    isGroup: row.is_group,
    program: row.program,
    remainingSeats: row.remaining_seats === undefined ? undefined : Number(row.remaining_seats),
  };
}

// Seats left on a journey: capacity minus travellers already held by bookings or
// reservations. Both holds are counted so the two flows cannot oversell a journey.
const REMAINING_SEATS_SQL = `
  j.capacity
  - COALESCE((SELECT SUM(b.travellers_count) FROM bookings b
              WHERE b.journey_id = j.id AND b.status IN ('pending', 'confirmed')), 0)
  - COALESCE((SELECT SUM(r.travellers_count) FROM reservations r
              WHERE r.journey_id = j.id AND r.status IN ('pending', 'confirmed')), 0)`;

async function loadJourneyWithSeats(client, journeyId, { forUpdate = false } = {}) {
  const { rows } = await client.query(
    `SELECT j.*, ${JOURNEY_IMAGES_SQL}, ${REMAINING_SEATS_SQL} AS remaining_seats
     FROM journeys j WHERE j.id = $1${forUpdate ? ' FOR UPDATE OF j' : ''}`,
    [journeyId]
  );
  return rows[0] || null;
}

async function loadOptionsByIds(client, ids) {
  if (!ids.length) return new Map();
  const { rows } = await client.query(
    'SELECT * FROM journey_options WHERE id = ANY($1::int[])',
    [ids]
  );
  return new Map(rows.map((r) => [r.id, r]));
}

function requireOption(options, id, category, fieldName) {
  const option = options.get(id);
  if (!option) throw badRequest(`${fieldName} is not a valid option`);
  if (category && option.category !== category) {
    throw badRequest(`${fieldName} must be a ${category} option`);
  }
  return option;
}

function parseParticipantNames(body, travellers) {
  const participants = Array.isArray(body.participants) ? body.participants : [];
  if (participants.length > 0 && participants.length !== travellers) {
    throw badRequest('participants count must match travellersCount');
  }
  for (const p of participants) {
    if (!isNonEmptyString(p.fullName, 200)) throw badRequest('each participant needs a fullName');
  }
  return participants.map((p) => p.fullName.trim());
}

// Build the validated reservation payload (selectedOptions + server-computed
// pricing) for any of the three flows. Reads every price from the database.
async function resolveReservation(client, body) {
  const reservationType = body.reservationType;
  if (!RESERVATION_TYPES.includes(reservationType)) {
    throw badRequest(`reservationType must be one of ${RESERVATION_TYPES.join(', ')}`);
  }

  if (reservationType === 'PERSONAL') {
    const journeyId = Number(body.journeyId);
    const travellers = Number(body.travellersCount);
    const transportOptionId = Number(body.transportOptionId);
    if (!Number.isInteger(journeyId) || journeyId <= 0) throw badRequest('journeyId must be a positive integer');
    if (!isPositiveInt(travellers) || travellers > MAX_TRAVELLERS) {
      throw badRequest(`travellersCount must be between 1 and ${MAX_TRAVELLERS}`);
    }
    if (!isPositiveInt(transportOptionId)) throw badRequest('transportOptionId is required');
    if (!SERVICE_TIER_IDS.includes(body.tier)) throw badRequest('tier must be a known service tier');

    const preferencesInput = body.preferences || {};
    const comfort = COMFORT_PREFERENCES.includes(preferencesInput.comfort) ? preferencesInput.comfort : '';
    const schedule = SCHEDULE_PREFERENCES.includes(preferencesInput.schedule) ? preferencesInput.schedule : '';

    const journey = await loadJourneyWithSeats(client, journeyId);
    if (!journey || journey.status !== 'published') throw notFound('Journey not found');

    const transport = requireOption(
      await loadOptionsByIds(client, [transportOptionId]),
      transportOptionId,
      'transport',
      'transportOptionId'
    );

    const tier = serviceTier(body.tier);
    const journeyCents = toCents(journey.price);
    const transportCents = toCents(transport.price);
    // Scale/degree multiplies the journey price; the chosen transport is added per traveller.
    const perTravellerCents = Math.round(journeyCents * tierMultiplier(tier.id)) + transportCents;
    const subtotalCents = perTravellerCents * travellers;

    return {
      reservationType,
      journeyId: journey.id,
      travellersCount: travellers,
      participants: [],
      subtotalCents,
      pricing: finalizePricing(subtotalCents, [
        {
          label: `${journey.title} — ${tier.label}`,
          detail: `${centsToDecimalString(journeyCents)} × ${travellers} traveller(s), tier ×${tier.multiplier}`,
          cents: Math.round(journeyCents * tierMultiplier(tier.id)) * travellers,
        },
        {
          label: transport.name,
          detail: `${centsToDecimalString(transportCents)} × ${travellers} traveller(s)`,
          cents: transportCents * travellers,
        },
      ]),
      selectedOptions: {
        tier: tier.id,
        tierLabel: tier.label,
        tierMultiplier: tier.multiplier,
        preferences: { comfort, schedule },
        transport: optionToJson(transport),
        unitPrice: centsToDecimalString(perTravellerCents),
        travellers: travellers,
        journey: {
          id: journey.id,
          title: journey.title,
          destination: journey.destination,
          startDate: journey.start_date,
          endDate: journey.end_date,
        },
      },
    };
  }

  if (reservationType === 'GROUP') {
    const journeyId = Number(body.journeyId);
    const travellers = Number(body.travellersCount);
    if (!Number.isInteger(journeyId) || journeyId <= 0) throw badRequest('journeyId must be a positive integer');
    if (!isPositiveInt(travellers) || travellers > MAX_TRAVELLERS) {
      throw badRequest(`travellersCount must be between 1 and ${MAX_TRAVELLERS}`);
    }

    const journey = await loadJourneyWithSeats(client, journeyId);
    if (!journey || journey.status !== 'published') throw notFound('Journey not found');
    if (!journey.is_group) throw badRequest('This journey is not an organized group journey');

    const participants = parseParticipantNames(body, travellers);
    const journeyCents = toCents(journey.price);
    const subtotalCents = journeyCents * travellers;

    return {
      reservationType,
      journeyId: journey.id,
      travellersCount: travellers,
      participants,
      subtotalCents,
      pricing: finalizePricing(subtotalCents, [
        {
          label: journey.title,
          detail: `${centsToDecimalString(journeyCents)} × ${travellers} participant(s)`,
          cents: subtotalCents,
        },
      ]),
      selectedOptions: {
        journey: {
          id: journey.id,
          title: journey.title,
          destination: journey.destination,
          startDate: journey.start_date,
          endDate: journey.end_date,
          durationDays: journey.duration_days,
          program: journey.program,
        },
        participants: travellers,
        remainingSeats: Number(journey.remaining_seats),
      },
    };
  }

  // CUSTOM — destination(s), stopover experiences, party size and custom transport.
  const members = Number(body.members);
  if (!isPositiveInt(members) || members > MAX_CUSTOM_MEMBERS) {
    throw badRequest(`members must be between 1 and ${MAX_CUSTOM_MEMBERS}`);
  }
  if (!PARTY_TYPES.includes(body.partyType)) throw badRequest('partyType must be a known party type');

  const destinations = Array.isArray(body.destinations)
    ? body.destinations.filter((d) => isNonEmptyString(d, 200)).map((d) => d.trim())
    : [];
  if (destinations.length === 0) throw badRequest('at least one destination is required');
  if (destinations.length > 5) throw badRequest('a custom trip is limited to 5 destinations');

  const { rows: knownRows } = await client.query(
    `SELECT DISTINCT destination FROM journeys WHERE status = 'published'`
  );
  const knownDestinations = new Set(knownRows.map((r) => r.destination));
  for (const destination of destinations) {
    if (!knownDestinations.has(destination)) throw badRequest(`Unknown destination: ${destination}`);
  }

  const stopoverIds = Array.isArray(body.stopoverOptionIds)
    ? [...new Set(body.stopoverOptionIds.map((id) => Number(id)))]
    : [];
  if (stopoverIds.length > 8) throw badRequest('at most 8 stopover experiences per trip');
  for (const id of stopoverIds) {
    if (!isPositiveInt(id)) throw badRequest('stopoverOptionIds must be positive integers');
  }

  const transportOptionId = Number(body.transportOptionId);
  if (!isPositiveInt(transportOptionId)) throw badRequest('transportOptionId is required');

  const options = await loadOptionsByIds(client, [transportOptionId, ...stopoverIds]);
  const transport = requireOption(options, transportOptionId, 'transport', 'transportOptionId');
  const stopovers = stopoverIds.map((id) => requireOption(options, id, 'activity', 'stopoverOptionIds'));

  const transportCents = toCents(transport.price);
  const stopoverCents = stopovers.reduce((sum, o) => sum + toCents(o.price), 0);
  // The planning fee is fixed for the trip; the chosen transport and every
  // stopover experience are charged per member.
  const subtotalCents = CUSTOM_PLANNING_FEE_CENTS + (transportCents + stopoverCents) * members;

  const lines = [
    {
      label: 'Custom-trip planning fee',
      detail: 'Itinerary built by a local agent (fixed)',
      cents: CUSTOM_PLANNING_FEE_CENTS,
    },
    {
      label: transport.name,
      detail: `${centsToDecimalString(transportCents)} × ${members} member(s)`,
      cents: transportCents * members,
    },
    ...stopovers.map((stopover) => ({
      label: stopover.name,
      detail: `${centsToDecimalString(toCents(stopover.price))} × ${members} member(s)`,
      cents: toCents(stopover.price) * members,
    })),
  ];

  return {
    reservationType,
    journeyId: null,
    travellersCount: members,
    participants: [],
    subtotalCents,
    pricing: finalizePricing(subtotalCents, lines),
    selectedOptions: {
      destinations,
      partyType: body.partyType,
      members,
      transport: optionToJson(transport),
      stopoverPlaces: stopovers.map(optionToJson),
    },
  };
}

function reservationToJson(row, extra = {}) {
  return {
    id: row.id,
    reference: row.reference,
    reservationType: row.reservation_type,
    journeyId: row.journey_id,
    travellersCount: row.travellers_count,
    selectedOptions: row.selected_options,
    pricing: {
      subtotal: row.subtotal,
      taxes: row.taxes,
      fees: row.fees,
      total: row.total_price,
    },
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    ...extra,
  };
}

async function loadParticipants(client, reservationId) {
  const { rows } = await client.query(
    'SELECT id, full_name, status FROM reservation_participants WHERE reservation_id = $1 ORDER BY id',
    [reservationId]
  );
  return rows.map((r) => ({ id: r.id, fullName: r.full_name, status: r.status }));
}

async function loadReservationRow(client, id) {
  const { rows } = await client.query('SELECT * FROM reservations WHERE id = $1', [id]);
  return rows[0] || null;
}

// GET /api/reservations/catalog — everything the wizard needs to render its steps:
// published journeys with live seat availability, the option catalogue, the service
// tiers and the disclosed pricing rules.
reservationsRouter.get(
  '/catalog',
  asyncHandler(async (_req, res) => {
    const { rows: journeyRows } = await pool.query(
      `SELECT j.*, ${JOURNEY_IMAGES_SQL}, ${REMAINING_SEATS_SQL} AS remaining_seats
       FROM journeys j WHERE j.status = 'published' ORDER BY j.title ASC`
    );
    const { rows: optionRows } = await pool.query(
      'SELECT * FROM journey_options ORDER BY category, name'
    );
    res.json({
      journeys: journeyRows.map(journeyToJson),
      destinations: [...new Set(journeyRows.map((r) => r.destination))].sort(),
      options: optionRows.map(optionToJson),
      serviceTiers: SERVICE_TIERS,
      preferences: { comfort: COMFORT_PREFERENCES, schedule: SCHEDULE_PREFERENCES },
      partyTypes: PARTY_TYPES,
      pricing: {
        taxRate: TAX_RATE,
        serviceFee: centsToDecimalString(SERVICE_FEE_CENTS),
        customPlanningFee: centsToDecimalString(CUSTOM_PLANNING_FEE_CENTS),
      },
    });
  })
);

// POST /api/reservations/quote — validate a configuration and return the
// server-computed pricing payload without storing anything.
reservationsRouter.post(
  '/quote',
  requireAuth,
  asyncHandler(async (req, res) => {
    const resolved = await resolveReservation(pool, req.body || {});
    res.json({
      reservationType: resolved.reservationType,
      selectedOptions: resolved.selectedOptions,
      pricing: resolved.pricing,
    });
  })
);

// POST /api/reservations — store a validated reservation (still unpaid).
reservationsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resolved = await resolveReservation(client, req.body || {});

      // Lock the journey row before checking seats so concurrent reservations
      // cannot both slip into the last available seat.
      if (resolved.journeyId) {
        const journey = await loadJourneyWithSeats(client, resolved.journeyId, { forUpdate: true });
        if (!journey || journey.status !== 'published') {
          await client.query('ROLLBACK');
          throw notFound('Journey not found');
        }
        if (Number(journey.remaining_seats) < resolved.travellersCount) {
          await client.query('ROLLBACK');
          throw conflict('Not enough seats left on this journey');
        }
      }

      const { rows } = await client.query(
        `INSERT INTO reservations
           (reference, user_id, reservation_type, journey_id, travellers_count,
            subtotal, taxes, fees, total_price, selected_options)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          newReservationReference(),
          req.user.id,
          resolved.reservationType,
          resolved.journeyId,
          resolved.travellersCount,
          resolved.pricing.subtotal,
          resolved.pricing.taxes,
          resolved.pricing.fees,
          resolved.pricing.total,
          JSON.stringify(resolved.selectedOptions),
        ]
      );
      const reservation = rows[0];

      for (const fullName of resolved.participants) {
        await client.query(
          'INSERT INTO reservation_participants (reservation_id, full_name) VALUES ($1, $2)',
          [reservation.id, fullName]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({
        reservation: reservationToJson(reservation, {
          pricing: { ...resolved.pricing },
          participants: resolved.participants.map((fullName, i) => ({
            id: i,
            fullName,
            status: 'invited',
          })),
        }),
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  })
);

// GET /api/reservations/:id — owner or admin only.
reservationsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid reservation id');
    const row = await loadReservationRow(pool, id);
    if (!row) throw notFound('Reservation not found');
    if (row.user_id !== req.user.id && req.user.role !== 'admin') {
      throw forbidden('Not your reservation');
    }
    res.json({
      reservation: reservationToJson(row, {
        participants: await loadParticipants(pool, row.id),
      }),
    });
  })
);

// POST /api/reservations/:id/pay — simulated payment (no real money, no card data).
// Body: { simulate: 'success' | 'failure' } (demo switch), default 'success'.
// A paid reservation rejects further attempts and a unique partial index keeps at
// most one successful payment row per reservation.
reservationsRouter.post(
  '/:id/pay',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid reservation id');
    const simulate = (req.body && req.body.simulate) || 'success';
    if (!['success', 'failure'].includes(simulate)) {
      throw badRequest("simulate must be 'success' or 'failure'");
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM reservations WHERE id = $1 FOR UPDATE', [id]);
      const reservation = rows[0];
      if (!reservation) { await client.query('ROLLBACK'); throw notFound('Reservation not found'); }
      if (reservation.user_id !== req.user.id) {
        await client.query('ROLLBACK');
        throw forbidden('Not your reservation');
      }
      if (reservation.status === 'cancelled') {
        await client.query('ROLLBACK');
        throw conflict('This reservation is cancelled');
      }
      if (reservation.payment_status === 'paid') {
        await client.query('ROLLBACK');
        throw conflict('This reservation is already paid');
      }

      if (simulate === 'success') {
        try {
          await client.query(
            'INSERT INTO reservation_payments (reservation_id, outcome, amount) VALUES ($1, $2, $3)',
            [id, 'success', reservation.total_price]
          );
        } catch (err) {
          if (err.code === '23505') {
            await client.query('ROLLBACK');
            throw conflict('A successful payment already exists for this reservation');
          }
          throw err;
        }
        await client.query(
          `UPDATE reservations SET payment_status = 'paid', status = 'confirmed' WHERE id = $1`,
          [id]
        );
      } else {
        await client.query(
          'INSERT INTO reservation_payments (reservation_id, outcome, amount) VALUES ($1, $2, $3)',
          [id, 'failure', reservation.total_price]
        );
        await client.query(`UPDATE reservations SET payment_status = 'failed' WHERE id = $1`, [id]);
      }

      const { rows: after } = await client.query('SELECT * FROM reservations WHERE id = $1', [id]);
      await client.query('COMMIT');
      res.json({
        reservation: reservationToJson(after[0], {
          participants: await loadParticipants(pool, id),
        }),
        payment: { simulated: true, outcome: simulate },
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  })
);
