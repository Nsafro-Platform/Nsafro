import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  badRequest, notFound, conflict, asyncHandler,
  isNonEmptyString, isEmail, isPositiveInt, toCents, centsToDecimalString,
} from '../util.js';

export const adminRouter = Router();

const QUOTE_STATUSES = ['submitted', 'in_review', 'quoted', 'rejected'];
const USER_ROLES = ['user', 'admin'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

// GET /api/admin/quote-requests — all quote requests with itinerary details.
adminRouter.get(
  '/quote-requests',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT q.id, q.status, q.agent_note, q.submitted_at, q.updated_at,
              u.email AS user_email, u.full_name AS user_name, i.id AS itinerary_id, i.title,
              (
                SELECT COALESCE(SUM(o.price * ii.quantity), 0)
                FROM itinerary_items ii JOIN journey_options o ON o.id = ii.option_id
                WHERE ii.itinerary_id = i.id
              ) AS indicated_total
       FROM quote_requests q
       JOIN users u ON u.id = q.user_id
       JOIN itineraries i ON i.id = q.itinerary_id
       ORDER BY q.submitted_at DESC, q.id DESC`
    );
    res.json({
      quoteRequests: rows.map((r) => ({
        id: r.id,
        status: r.status,
        agentNote: r.agent_note,
        submittedAt: r.submitted_at,
        updatedAt: r.updated_at,
        user: { email: r.user_email, name: r.user_name },
        itineraryId: r.itinerary_id,
        itineraryTitle: r.title,
        indicatedTotal: centsToDecimalString(toCents(r.indicated_total)),
      })),
    });
  })
);

// PATCH /api/admin/quote-requests/:id — update status and/or agent note.
adminRouter.patch(
  '/quote-requests/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid quote request id');
    const body = req.body || {};
    const updates = {};
    if (body.status !== undefined) {
      if (!QUOTE_STATUSES.includes(body.status)) {
        throw badRequest(`status must be one of: ${QUOTE_STATUSES.join(', ')}`);
      }
      updates.status = body.status;
    }
    if (body.agentNote !== undefined) {
      if (!isNonEmptyString(body.agentNote, 2000)) throw badRequest('agentNote must be a non-empty string');
      updates.agent_note = body.agentNote.trim();
    }
    if (!Object.keys(updates).length) throw badRequest('Nothing to update');

    const keys = Object.keys(updates);
    const sets = keys.map((k, i) => `${k} = $${i + 2}`);
    const values = keys.map((k) => updates[k]);
    const { rows } = await pool.query(
      `UPDATE quote_requests SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    if (!rows.length) throw notFound('Quote request not found');
    res.json({
      quoteRequest: {
        id: rows[0].id,
        status: rows[0].status,
        agentNote: rows[0].agent_note,
        updatedAt: rows[0].updated_at,
      },
    });
  })
);

// GET /api/admin/dashboard/stats
adminRouter.get(
  '/dashboard/stats',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const [{ rows: users }, { rows: journeys }, { rows: bookings }, { rows: quotes }] = await Promise.all([
      pool.query('SELECT COUNT(*) as count, SUM(CASE WHEN role=\'admin\' THEN 1 ELSE 0 END) as admins FROM users'),
      pool.query('SELECT COUNT(*) as count, SUM(CASE WHEN status=\'published\' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status=\'draft\' THEN 1 ELSE 0 END) as drafts FROM journeys'),
      pool.query('SELECT COUNT(*) as count, SUM(CASE WHEN payment_status=\'paid\' THEN 1 ELSE 0 END) as paid FROM bookings'),
      pool.query('SELECT COUNT(*) as count, SUM(CASE WHEN status=\'submitted\' THEN 1 ELSE 0 END) as submitted FROM quote_requests'),
    ]);
    res.json({ users: users[0], journeys: journeys[0], bookings: bookings[0], quotes: quotes[0] });
  })
);

// Users
adminRouter.get('/users', requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC');
  res.json({ users: rows.map(r => ({ id: r.id, email: r.email, fullName: r.full_name, role: r.role, createdAt: r.created_at })) });
}));

adminRouter.patch('/users/:id/role', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid user id');
  const role = String(req.body?.role || '');
  if (!USER_ROLES.includes(role)) throw badRequest(`role must be one of: ${USER_ROLES.join(', ')}`);
  const { rows } = await pool.query('UPDATE users SET role = $2 WHERE id = $1 RETURNING id, email, full_name, role', [id, role]);
  if (!rows.length) throw notFound('User not found');
  res.json({ user: { id: rows[0].id, email: rows[0].email, fullName: rows[0].full_name, role: rows[0].role } });
}));

// Bookings
adminRouter.get('/bookings', requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT b.*, j.title AS journey_title, u.email AS user_email, u.full_name AS user_name
     FROM bookings b JOIN journeys j ON j.id = b.journey_id JOIN users u ON u.id = b.user_id ORDER BY b.created_at DESC, b.id DESC`
  );
  res.json({ bookings: rows.map(r => ({
    id: r.id, reference: r.reference, journeyId: r.journey_id,
    travellersCount: r.travellers_count, unitPrice: r.unit_price, totalPrice: r.total_price,
    status: r.status, paymentStatus: r.payment_status, createdAt: r.created_at,
    journey: { id: r.journey_id, title: r.journey_title },
    user: { email: r.user_email, name: r.user_name },
  })) });
}));

adminRouter.patch('/bookings/:id', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid booking id');
  const updates = {};
  const body = req.body || {};
  if (body.status !== undefined) {
    if (!BOOKING_STATUSES.includes(body.status)) throw badRequest(`status must be one of: ${BOOKING_STATUSES.join(', ')}`);
    updates.status = body.status;
  }
  if (body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus)) throw badRequest(`paymentStatus must be one of: ${PAYMENT_STATUSES.join(', ')}`);
    updates.payment_status = body.paymentStatus;
  }
  if (!Object.keys(updates).length) throw badRequest('Nothing to update');
  const keys = Object.keys(updates);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map((k) => updates[k]);
  const { rows } = await pool.query(`UPDATE bookings SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...values]);
  if (!rows.length) throw notFound('Booking not found');
  res.json({ ok: true });
}));

// Options
adminRouter.post('/options', requireAdmin, asyncHandler(async (req, res) => {
  const { category, name, description, price } = req.body || {};
  const valid = ['transport', 'accommodation', 'activity'];
  if (!valid.includes(String(category))) throw badRequest('Invalid category');
  if (!isNonEmptyString(name, 200)) throw badRequest('name is required');
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) throw badRequest('price must be a non-negative number');
  const { rows } = await pool.query('INSERT INTO journey_options (category, name, description, price) VALUES ($1, $2, $3, $4) RETURNING *',
    [category, name.trim(), description ? String(description).trim() : null, priceNum.toFixed(2)]);
  res.status(201).json({ option: rows[0] });
}));

adminRouter.patch('/options/:id', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid option id');
  const updates = {};
  const body = req.body || {};
  if (body.category !== undefined) {
    const valid = ['transport', 'accommodation', 'activity'];
    if (!valid.includes(String(body.category))) throw badRequest('Invalid category');
    updates.category = body.category;
  }
  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name, 200)) throw badRequest('name is required');
    updates.name = body.name.trim();
  }
  if (body.description !== undefined) {
    updates.description = body.description ? String(body.description).trim() : null;
  }
  if (body.price !== undefined) {
    const priceNum = Number(body.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) throw badRequest('price must be a non-negative number');
    updates.price = priceNum.toFixed(2);
  }
  if (!Object.keys(updates).length) throw badRequest('Nothing to update');
  const keys = Object.keys(updates);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map((k) => updates[k]);
  const { rows } = await pool.query(`UPDATE journey_options SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...values]);
  if (!rows.length) throw notFound('Option not found');
  res.json({ option: rows[0] });
}));

adminRouter.delete('/options/:id', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid option id');
  const { rowCount } = await pool.query('DELETE FROM journey_options WHERE id = $1', [id]);
  if (!rowCount) throw notFound('Option not found');
  res.json({ ok: true });
}));

// Destinations
adminRouter.get('/destinations', requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT DISTINCT destination, COUNT(*) as journey_count FROM journeys WHERE destination IS NOT NULL AND destination != \'\' GROUP BY destination ORDER BY destination');
  res.json({ destinations: rows });
}));
