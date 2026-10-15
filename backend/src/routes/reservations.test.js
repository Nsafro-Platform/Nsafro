import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { pool } from '../db/pool.js';
import { migrate } from '../db/migrate.js';

// Integration tests for the multi-type reservation module. They run against the
// database configured in backend/.env (seed it with `npm run seed` first), create
// their own disposable users, and delete every row they create.

const app = createApp();
const stamp = Date.now();
const createdReservationIds = [];
const createdUserEmails = [];

const owner = request.agent(app);
const other = request.agent(app);

let personalJourney;
let groupJourney;
let transportOption;
let activityOption;

async function signUp(agent, label) {
  const email = `resv-${label}-${stamp}@example.com`;
  createdUserEmails.push(email);
  const res = await agent
    .post('/api/auth/register')
    .send({ email, password: 'Test1234!', fullName: `Reservation Test ${label}` });
  expect(res.status).toBe(201);
  return res.body.user;
}

async function quote(agent, payload) {
  return agent.post('/api/reservations/quote').send(payload);
}

async function create(agent, payload) {
  const res = await agent.post('/api/reservations').send(payload);
  if (res.status === 201) createdReservationIds.push(res.body.reservation.id);
  return res;
}

function personalPayload(overrides = {}) {
  return {
    reservationType: 'PERSONAL',
    journeyId: personalJourney.id,
    tier: 'standard',
    transportOptionId: transportOption.id,
    travellersCount: 1,
    ...overrides,
  };
}

beforeAll(async () => {
  await migrate();
  await signUp(owner, 'owner');
  await signUp(other, 'other');

  const catalog = await request(app).get('/api/reservations/catalog');
  expect(catalog.status).toBe(200);
  if (catalog.body.journeys.length === 0) {
    throw new Error('No published journeys found — run `npm run seed` before the tests.');
  }

  personalJourney = catalog.body.journeys.find((j) => !j.isGroup);
  groupJourney = [...catalog.body.journeys]
    .filter((j) => j.isGroup && j.remainingSeats > 0)
    .sort((a, b) => a.remainingSeats - b.remainingSeats)[0];
  transportOption = catalog.body.options.find((o) => o.category === 'transport');
  activityOption = catalog.body.options.find((o) => o.category === 'activity');
}, 30000);

afterAll(async () => {
  if (createdReservationIds.length) {
    await pool.query('DELETE FROM reservation_payments WHERE reservation_id = ANY($1::int[])', [
      createdReservationIds,
    ]);
    await pool.query('DELETE FROM reservations WHERE id = ANY($1::int[])', [
      createdReservationIds,
    ]);
  }
  if (createdUserEmails.length) {
    await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [createdUserEmails]);
  }
  await pool.end();
});

describe('GET /api/reservations/catalog', () => {
  test('exposes published journeys with live seats, options and pricing rules', async () => {
    const res = await request(app).get('/api/reservations/catalog');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.journeys)).toBe(true);
    expect(res.body.journeys.every((j) => Number.isInteger(j.remainingSeats))).toBe(true);
    expect(res.body.serviceTiers.map((t) => t.id)).toContain('premium');
    expect(res.body.options.some((o) => o.category === 'transport')).toBe(true);
    expect(Number(res.body.pricing.taxRate)).toBeGreaterThan(0);
  });
});

describe('POST /api/reservations/quote', () => {
  test('requires authentication', async () => {
    const res = await request(app).post('/api/reservations/quote').send(personalPayload());
    expect(res.status).toBe(401);
  });

  test('prices a personal reservation from stored values and ignores client amounts', async () => {
    const res = await quote(owner, {
      ...personalPayload({ tier: 'premium', travellersCount: 2 }),
      pricing: { subtotal: '0.00', taxes: '0.00', fees: '0.00', total: '1.00' },
    });
    expect(res.status).toBe(200);

    const journeyCents = Math.round(Number(personalJourney.price) * 100);
    const transportCents = Math.round(Number(transportOption.price) * 100);
    const perTraveller = Math.round(journeyCents * 1.6) + transportCents;
    const subtotal = perTraveller * 2;

    expect(res.body.pricing.subtotal).toBe((subtotal / 100).toFixed(2));
    expect(res.body.pricing.total).toBe(
      ((subtotal + Math.round(subtotal * 0.1) + 2500) / 100).toFixed(2),
    );
    expect(res.body.selectedOptions.tierLabel).toBe('Premium');
    expect(res.body.selectedOptions.unitPrice).toBe((perTraveller / 100).toFixed(2));
  });

  test('rejects an unknown tier', async () => {
    const res = await quote(owner, personalPayload({ tier: 'deluxe' }));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tier/);
  });

  test('rejects an option that is not a transport option', async () => {
    const res = await quote(owner, personalPayload({ transportOptionId: activityOption.id }));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transport/);
  });

  test('rejects an unknown journey id', async () => {
    const res = await quote(owner, personalPayload({ journeyId: 99999999 }));
    expect(res.status).toBe(404);
  });

  test('rejects an unknown reservation type', async () => {
    const res = await quote(owner, { ...personalPayload(), reservationType: 'TEAM' });
    expect(res.status).toBe(400);
  });

  test('a group reservation must target an organized group journey', async () => {
    const res = await quote(owner, {
      reservationType: 'GROUP',
      journeyId: personalJourney.id,
      travellersCount: 1,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/group journey/i);
  });

  test('a custom trip must use known destinations and priced options', async () => {
    const bad = await quote(owner, {
      reservationType: 'CUSTOM',
      destinations: ['Atlantis'],
      transportOptionId: transportOption.id,
      members: 2,
      partyType: 'family',
    });
    expect(bad.status).toBe(400);

    const good = await quote(owner, {
      reservationType: 'CUSTOM',
      destinations: [personalJourney.destination],
      stopoverOptionIds: [activityOption.id],
      transportOptionId: transportOption.id,
      members: 3,
      partyType: 'family',
    });
    expect(good.status).toBe(200);
    // Planning fee + (transport + stopover) × members, then tax and the flat fee.
    const members = 3;
    const subtotal =
      15000 +
      (Math.round(Number(transportOption.price) * 100) +
        Math.round(Number(activityOption.price) * 100)) *
        members;
    expect(good.body.pricing.subtotal).toBe((subtotal / 100).toFixed(2));
  });
});

describe('POST /api/reservations and simulated payment', () => {
  test('stores the reservation and takes exactly one successful payment', async () => {
    const created = await create(owner, personalPayload({ travellersCount: 2 }));
    expect(created.status).toBe(201);
    const reservation = created.body.reservation;
    expect(reservation.reference).toMatch(/^RSV-[A-Z0-9]{8}$/);
    expect(reservation.paymentStatus).toBe('unpaid');

    const paid = await owner.post(`/api/reservations/${reservation.id}/pay`).send({ simulate: 'success' });
    expect(paid.status).toBe(200);
    expect(paid.body.reservation.paymentStatus).toBe('paid');
    expect(paid.body.reservation.status).toBe('confirmed');

    const duplicate = await owner
      .post(`/api/reservations/${reservation.id}/pay`)
      .send({ simulate: 'success' });
    expect(duplicate.status).toBe(409);

    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS n FROM reservation_payments WHERE reservation_id = $1 AND outcome = 'success'",
      [reservation.id],
    );
    expect(rows[0].n).toBe(1);
  });

  test('a declined attempt can be retried', async () => {
    const created = await create(owner, personalPayload({ travellersCount: 1 }));
    const id = created.body.reservation.id;

    const failed = await owner.post(`/api/reservations/${id}/pay`).send({ simulate: 'failure' });
    expect(failed.status).toBe(200);
    expect(failed.body.reservation.paymentStatus).toBe('failed');

    const retried = await owner.post(`/api/reservations/${id}/pay`).send({ simulate: 'success' });
    expect(retried.status).toBe(200);
    expect(retried.body.reservation.paymentStatus).toBe('paid');
  });

  test('an unknown reservation cannot be paid', async () => {
    const res = await owner.post('/api/reservations/99999999/pay').send({ simulate: 'success' });
    expect(res.status).toBe(404);
  });
});

describe('group capacity', () => {
  test('refuses to oversell a journey and reflects the held seats', async () => {
    if (!groupJourney || groupJourney.remainingSeats > 20) {
      console.warn('Skipping capacity test: no group journey with 1–20 free seats.');
      return;
    }
    const seats = groupJourney.remainingSeats;

    const fill = await create(owner, {
      reservationType: 'GROUP',
      journeyId: groupJourney.id,
      travellersCount: seats,
      participants: Array.from({ length: seats }, (_, i) => ({ fullName: `Guest ${i + 1}` })),
    });
    expect(fill.status).toBe(201);
    expect(fill.body.reservation.participants).toHaveLength(seats);

    const over = await create(owner, {
      reservationType: 'GROUP',
      journeyId: groupJourney.id,
      travellersCount: 1,
    });
    expect(over.status).toBe(409);
    expect(over.body.error).toMatch(/seat/i);

    const catalog = await request(app).get('/api/reservations/catalog');
    const after = catalog.body.journeys.find((j) => j.id === groupJourney.id);
    expect(after.remainingSeats).toBe(0);
  });
});

describe('ownership', () => {
  test('another user cannot read or pay a reservation that is not theirs', async () => {
    const created = await create(owner, personalPayload({ travellersCount: 1 }));
    const id = created.body.reservation.id;

    const read = await other.get(`/api/reservations/${id}`);
    expect(read.status).toBe(403);

    const pay = await other.post(`/api/reservations/${id}/pay`).send({ simulate: 'success' });
    expect(pay.status).toBe(403);

    const mine = await owner.get(`/api/reservations/${id}`);
    expect(mine.status).toBe(200);
    expect(mine.body.reservation.id).toBe(id);
  });

  test('unauthenticated requests are rejected', async () => {
    const created = await create(owner, personalPayload({ travellersCount: 1 }));
    const id = created.body.reservation.id;
    const read = await request(app).get(`/api/reservations/${id}`);
    expect(read.status).toBe(401);
  });
});
