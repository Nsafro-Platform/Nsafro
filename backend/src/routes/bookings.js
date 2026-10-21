import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  badRequest, notFound, conflict, forbidden, asyncHandler,
  isPositiveInt, isNonEmptyString, toCents, centsToDecimalString, newBookingReference,
} from '../util.js';

export const bookingsRouter = Router();

function bookingToJson(row, extra = {}) {
  return {
    id: row.id,
    reference: row.reference,
    journeyId: row.journey_id,
    travellersCount: row.travellers_count,
    unitPrice: row.unit_price,
    totalPrice: row.total_price,
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    ...extra,
  };
}

async function loadParticipants(client, bookingId) {
  const { rows } = await client.query(
    'SELECT id, full_name, status FROM participants WHERE booking_id = $1 ORDER BY id',
    [bookingId]
  );
  return rows.map((r) => ({ id: r.id, fullName: r.full_name, status: r.status }));
}

// POST /api/bookings — create a booking (validated server-side, price from DB snapshot).
bookingsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const journeyId = Number(body.journeyId);
    const travellers = Number(body.travellersCount);
    if (!Number.isInteger(journeyId) || journeyId <= 0) throw badRequest('journeyId must be a positive integer');
    if (!isPositiveInt(travellers) || travellers > 20) throw badRequest('travellersCount must be between 1 and 20');

    const participants = Array.isArray(body.participants) ? body.participants : [];
    if (participants.length > 0 && participants.length !== travellers) {
      throw badRequest('participants count must match travellersCount');
    }
    for (const p of participants) {
      if (!isNonEmptyString(p.fullName, 200)) throw badRequest('each participant needs a fullName');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM journeys WHERE id = $1 FOR UPDATE', [journeyId]);
      const journey = rows[0];
      if (!journey || journey.status !== 'published') {
        await client.query('ROLLBACK');
        throw notFound('Journey not found');
      }

      const { rows: bookedRows } = await client.query(
        `SELECT COALESCE(SUM(travellers_count), 0) AS booked FROM bookings
         WHERE journey_id = $1 AND status IN ('pending', 'confirmed')`,
        [journeyId]
      );
      const alreadyBooked = Number(bookedRows[0].booked);
      if (alreadyBooked + travellers > journey.capacity) {
        await client.query('ROLLBACK');
        throw conflict('Not enough capacity for this journey');
      }

      // Price from trusted server-side data, summed in integer cents.
      const totalCents = toCents(journey.price) * travellers;
      const reference = newBookingReference();
      const { rows: bookingRows } = await client.query(
        `INSERT INTO bookings (reference, user_id, journey_id, travellers_count, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [reference, req.user.id, journeyId, travellers, journey.price, centsToDecimalString(totalCents)]
      );
      const booking = bookingRows[0];

      // The organizer is confirmed on the spot; the other travellers stay
      // "invited" until they accept (invitations are tracked in SCRUM-27).
      const payerName = req.user.fullName.trim().toLowerCase();
      for (const p of participants) {
        const fullName = p.fullName.trim();
        const status = fullName.toLowerCase() === payerName ? 'confirmed' : 'invited';
        await client.query(
          'INSERT INTO participants (booking_id, full_name, status) VALUES ($1, $2, $3)',
          [booking.id, fullName, status]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({
        booking: bookingToJson(booking, {
          journey: { id: journey.id, title: journey.title, destination: journey.destination, startDate: journey.start_date },
          participants: await loadParticipants(pool, booking.id),
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

// GET /api/bookings — the signed-in user's booking history.
bookingsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT b.*, j.title AS journey_title, j.destination AS journey_destination, j.start_date AS journey_start,
              COALESCE((
                SELECT json_agg(json_build_object('id', p.id, 'fullName', p.full_name, 'status', p.status) ORDER BY p.id)
                FROM participants p WHERE p.booking_id = b.id
              ), '[]'::json) AS participants
       FROM bookings b JOIN journeys j ON j.id = b.journey_id
       WHERE b.user_id = $1 ORDER BY b.created_at DESC, b.id DESC`,
      [req.user.id]
    );
    res.json({
      bookings: rows.map((r) =>
        bookingToJson(r, {
          journey: {
            id: r.journey_id,
            title: r.journey_title,
            destination: r.journey_destination,
            startDate: r.journey_start,
          },
          participants: r.participants,
        })
      ),
    });
  })
);

// Booking detail shared by the confirmation, the e-ticket and the edit screen:
// journey snapshot, live availability and the participant manifest.
async function loadBookingDetail(db, id) {
  const { rows } = await db.query(
    `SELECT b.*, j.title AS journey_title, j.destination AS journey_destination,
            j.start_date AS journey_start, j.end_date AS journey_end,
            j.duration_days AS journey_duration, j.transport AS journey_transport,
            j.capacity AS journey_capacity,
            COALESCE((SELECT SUM(b2.travellers_count) FROM bookings b2
                      WHERE b2.journey_id = b.journey_id AND b2.status IN ('pending', 'confirmed')), 0)
              AS journey_booked
     FROM bookings b JOIN journeys j ON j.id = b.journey_id WHERE b.id = $1`,
    [id]
  );
  const booking = rows[0];
  if (!booking) return null;
  return {
    ownerId: booking.user_id,
    booking: bookingToJson(booking, {
      journey: {
        id: booking.journey_id,
        title: booking.journey_title,
        destination: booking.journey_destination,
        startDate: booking.journey_start,
        endDate: booking.journey_end,
        durationDays: booking.journey_duration,
        transport: booking.journey_transport,
        capacity: booking.journey_capacity,
        // Seats taken by every booking, including this one.
        remainingSeats: Math.max(Number(booking.journey_capacity) - Number(booking.journey_booked), 0),
      },
      participants: await loadParticipants(db, booking.id),
    }),
  };
}

// GET /api/bookings/:id — owner or admin only.
bookingsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid booking id');
    const detail = await loadBookingDetail(pool, id);
    if (!detail) throw notFound('Booking not found');
    if (detail.ownerId !== req.user.id && req.user.role !== 'admin') throw forbidden('Not your booking');
    res.json({ booking: detail.booking });
  })
);

// PATCH /api/bookings/:id — the traveller changes an unpaid booking: traveller
// count and/or the participant names. Price stays the unit price snapshotted at
// creation, capacity is re-checked against every other booking on the offer.
bookingsRouter.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid booking id');
    const body = req.body || {};
    if (body.travellersCount === undefined && body.participants === undefined) {
      throw badRequest('Nothing to update');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [id]);
      const booking = rows[0];
      if (!booking) { await client.query('ROLLBACK'); throw notFound('Booking not found'); }
      if (booking.user_id !== req.user.id) {
        await client.query('ROLLBACK');
        throw forbidden('Not your booking');
      }
      if (booking.status === 'cancelled') {
        await client.query('ROLLBACK');
        throw conflict('A cancelled booking cannot be modified');
      }
      if (booking.payment_status === 'paid' || booking.status === 'confirmed') {
        await client.query('ROLLBACK');
        throw conflict('A paid booking cannot be modified; contact the agency');
      }

      const travellers = body.travellersCount === undefined
        ? booking.travellers_count
        : Number(body.travellersCount);
      if (!isPositiveInt(travellers) || travellers > 20) {
        await client.query('ROLLBACK');
        throw badRequest('travellersCount must be between 1 and 20');
      }

      const participants = body.participants === undefined
        ? null
        : (Array.isArray(body.participants) ? body.participants : []);
      if (participants) {
        if (participants.length !== travellers) {
          await client.query('ROLLBACK');
          throw badRequest('participants count must match travellersCount');
        }
        for (const p of participants) {
          if (!isNonEmptyString(p.fullName, 200)) {
            await client.query('ROLLBACK');
            throw badRequest('each participant needs a fullName');
          }
        }
      }

      // Capacity check ignores this booking's current seats: they are being replaced.
      const { rows: capRows } = await client.query(
        `SELECT j.capacity, COALESCE(SUM(b.travellers_count) FILTER (WHERE b.id <> $2), 0) AS booked
         FROM journeys j LEFT JOIN bookings b
           ON b.journey_id = j.id AND b.status IN ('pending', 'confirmed')
         WHERE j.id = $1 GROUP BY j.capacity`,
        [booking.journey_id, id]
      );
      if (!capRows.length) { await client.query('ROLLBACK'); throw notFound('Journey not found'); }
      if (Number(capRows[0].booked) + travellers > capRows[0].capacity) {
        await client.query('ROLLBACK');
        throw conflict('Not enough capacity for this journey');
      }

      await client.query(
        'UPDATE bookings SET travellers_count = $2, total_price = $3 WHERE id = $1',
        [id, travellers, centsToDecimalString(toCents(booking.unit_price) * travellers)]
      );

      if (participants) {
        await client.query('DELETE FROM participants WHERE booking_id = $1', [id]);
        const payerName = req.user.fullName.trim().toLowerCase();
        for (const p of participants) {
          const fullName = p.fullName.trim();
          const status = fullName.toLowerCase() === payerName ? 'confirmed' : 'invited';
          await client.query(
            'INSERT INTO participants (booking_id, full_name, status) VALUES ($1, $2, $3)',
            [id, fullName, status]
          );
        }
      }

      await client.query('COMMIT');
      const detail = await loadBookingDetail(pool, id);
      res.json({ booking: detail.booking });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  })
);

// POST /api/bookings/:id/pay — simulated payment (no real money, no card data).
// Body: { simulate: 'success' | 'failure' } (demo switch), default 'success'.
// Idempotency/duplicate protection: a paid booking rejects further payment attempts,
// and a DB unique index guarantees at most one successful payment per booking.
bookingsRouter.post(
  '/:id/pay',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid booking id');
    const simulate = (req.body && req.body.simulate) || 'success';
    if (!['success', 'failure'].includes(simulate)) throw badRequest("simulate must be 'success' or 'failure'");

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [id]);
      const booking = rows[0];
      if (!booking) { await client.query('ROLLBACK'); throw notFound('Booking not found'); }
      if (booking.user_id !== req.user.id) { await client.query('ROLLBACK'); throw forbidden('Not your booking'); }
      if (booking.status === 'cancelled') { await client.query('ROLLBACK'); throw conflict('This booking is cancelled'); }
      if (booking.payment_status === 'paid') {
        await client.query('ROLLBACK');
        throw conflict('This booking is already paid');
      }

      if (simulate === 'success') {
        try {
          await client.query('INSERT INTO payments (booking_id, outcome, amount) VALUES ($1, $2, $3)', [
            id, 'success', booking.total_price,
          ]);
        } catch (err) {
          // Unique partial index guards against true duplicate success rows.
          if (err.code === '23505') {
            await client.query('ROLLBACK');
            throw conflict('A successful payment already exists for this booking');
          }
          throw err;
        }
        await client.query(
          `UPDATE bookings SET payment_status = 'paid', status = 'confirmed' WHERE id = $1`,
          [id]
        );
      } else {
        await client.query('INSERT INTO payments (booking_id, outcome, amount) VALUES ($1, $2, $3)', [
          id, 'failure', booking.total_price,
        ]);
        await client.query(`UPDATE bookings SET payment_status = 'failed' WHERE id = $1`, [id]);
      }

      const { rows: after } = await client.query('SELECT * FROM bookings WHERE id = $1', [id]);
      await client.query('COMMIT');
      res.json({
        booking: bookingToJson(after[0]),
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

// GET /api/admin/bookings — admin overview of all bookings.
bookingsRouter.get(
  '/admin/all',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT b.*, j.title AS journey_title, u.email AS user_email
       FROM bookings b JOIN journeys j ON j.id = b.journey_id JOIN users u ON u.id = b.user_id
       ORDER BY b.created_at DESC, b.id DESC LIMIT 200`
    );
    res.json({
      bookings: rows.map((r) =>
        bookingToJson(r, {
          journey: { id: r.journey_id, title: r.journey_title },
          userEmail: r.user_email,
        })
      ),
    });
  })
);
