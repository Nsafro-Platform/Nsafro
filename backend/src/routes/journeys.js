import { Router } from 'express';
import { pool } from '../db/pool.js';
import { JOURNEY_IMAGES_SQL, journeyImages } from '../db/journeyGallery.js';
import { requireAdmin, loadUser } from '../middleware/auth.js';
import {
  badRequest, notFound, conflict, asyncHandler,
  isNonEmptyString, isIsoDate, isPositiveInt, toCents,
} from '../util.js';

export const journeysRouter = Router();

// Fields an admin may set; everything else is ignored (server-side whitelist).
const EDITABLE_FIELDS = [
  'title', 'summary', 'description', 'destination', 'start_date', 'end_date',
  'price', 'capacity', 'transport', 'accommodation', 'image_url',
  'is_group', 'program', 'status',
];

const STATUS_VALUES = new Set(['draft', 'published', 'archived']);

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
    // Principal image first, then the extra gallery photos.
    images: journeyImages(row),
    isGroup: row.is_group,
    program: row.program,
    status: row.status,
  };
}

function validateJourneyPayload(body, { partial }) {
  const out = {};
  const errors = [];

  const textFields = {
    title: 200, summary: 500, description: 5000, destination: 200,
    transport: 200, accommodation: 200, program: 5000,
  };
  for (const [field, max] of Object.entries(textFields)) {
    if (body[field] !== undefined) {
      if (!isNonEmptyString(body[field], max)) errors.push(`${field} must be a non-empty string`);
      else out[field] = body[field].trim();
    } else if (!partial && (field === 'title' || field === 'destination')) {
      errors.push(`${field} is required`);
    }
  }

  for (const field of ['start_date', 'end_date']) {
    if (body[field] !== undefined) {
      if (!isIsoDate(body[field])) errors.push(`${field} must be a YYYY-MM-DD date`);
      else out[field] = body[field];
    } else if (!partial) {
      errors.push(`${field} is required`);
    }
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) errors.push('price must be a non-negative number');
    else out.price = price.toFixed(2);
  } else if (!partial) {
    errors.push('price is required');
  }

  if (body.capacity !== undefined) {
    if (!isPositiveInt(body.capacity)) errors.push('capacity must be a positive integer');
    else out.capacity = body.capacity;
  } else if (!partial) {
    errors.push('capacity is required');
  }

  if (body.is_group !== undefined) {
    if (typeof body.is_group !== 'boolean') errors.push('is_group must be a boolean');
    else out.is_group = body.is_group;
  }

  if (body.status !== undefined) {
    if (!STATUS_VALUES.has(body.status)) errors.push('status must be draft, published or archived');
    else out.status = body.status;
  }

  if (out.start_date && out.end_date && out.end_date < out.start_date) {
    errors.push('end_date must be on or after start_date');
  }

  if (errors.length) throw badRequest(errors.join('; '));
  return out;
}

// GET /api/journeys — public catalogue with search/filter.
journeysRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await loadUser(req);
    const isAdmin = user && user.role === 'admin';

    const conditions = [];
    const params = [];

    if (!isAdmin) {
      conditions.push(`status = 'published'`);
    } else if (req.query.status && STATUS_VALUES.has(String(req.query.status))) {
      params.push(String(req.query.status));
      conditions.push(`status = $${params.length}`);
    }

    if (req.query.q && isNonEmptyString(req.query.q, 100)) {
      params.push(`%${req.query.q.trim()}%`);
      const p = `$${params.length}`;
      conditions.push(`(title ILIKE ${p} OR destination ILIKE ${p} OR summary ILIKE ${p})`);
    }
    if (req.query.destination && isNonEmptyString(req.query.destination, 100)) {
      params.push(`%${req.query.destination.trim()}%`);
      conditions.push(`destination ILIKE $${params.length}`);
    }
    const maxPrice = Number(req.query.maxPrice);
    if (Number.isFinite(maxPrice) && maxPrice >= 0) {
      params.push(maxPrice);
      conditions.push(`price <= ${`$${params.length}`}`);
    }
    if (req.query.group === 'true') conditions.push('is_group = TRUE');
    if (req.query.group === 'false') conditions.push('is_group = FALSE');

    const orderBy = req.query.sort === 'price_asc' ? 'price ASC, start_date ASC'
      : req.query.sort === 'price_desc' ? 'price DESC, start_date ASC'
      : 'start_date ASC, id ASC';

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Pagination: page (1-based), limit (default 12, max 50).
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 50) : 12;
    const pageRaw = Number(req.query.page);
    const page = Number.isFinite(pageRaw) ? Math.max(Math.floor(pageRaw), 1) : 1;

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS count FROM journeys ${where}`,
      params
    );
    const total = Number(countRows[0].count);
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    const { rows } = await pool.query(
      `SELECT j.*, ${JOURNEY_IMAGES_SQL} FROM journeys j ${where}
       ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    );
    res.json({ journeys: rows.map(journeyToJson), page, limit, total, totalPages });
  })
);

// GET /api/journeys/:id — detail (published for everyone; any status for admins).
journeysRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid journey id');
    const { rows } = await pool.query(
      `SELECT j.*, ${JOURNEY_IMAGES_SQL} FROM journeys j WHERE j.id = $1`,
      [id]
    );
    const journey = rows[0];
    if (!journey) throw notFound('Journey not found');
    const user = await loadUser(req);
    const isAdmin = user && user.role === 'admin';
    if (journey.status !== 'published' && !isAdmin) throw notFound('Journey not found');
    res.json({ journey: journeyToJson(journey) });
  })
);

// POST /api/journeys — admin: create offer.
journeysRouter.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = validateJourneyPayload(req.body || {}, { partial: false });
    const duration = Math.round(
      (Date.parse(data.end_date) - Date.parse(data.start_date)) / 86400000
    ) + 1;
    const keys = [...EDITABLE_FIELDS.filter((f) => data[f] !== undefined), 'duration_days'];
    const values = [...EDITABLE_FIELDS.map((f) => data[f]).filter((v) => v !== undefined), duration];
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const { rows } = await pool.query(
      `INSERT INTO journeys (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    res.status(201).json({ journey: journeyToJson(rows[0]) });
  })
);

// PATCH /api/journeys/:id — admin: edit offer (incl. publish/unpublish/archive).
journeysRouter.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid journey id');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM journeys WHERE id = $1 FOR UPDATE', [id]);
      const journey = rows[0];
      if (!journey) { await client.query('ROLLBACK'); throw notFound('Journey not found'); }

      const data = validateJourneyPayload(req.body || {}, { partial: true });

      if (data.capacity !== undefined) {
        const { rows: bookedRows } = await client.query(
          `SELECT COALESCE(SUM(travellers_count), 0) AS booked FROM bookings
           WHERE journey_id = $1 AND status IN ('pending', 'confirmed')`,
          [id]
        );
        if (Number(bookedRows[0].booked) > data.capacity) {
          await client.query('ROLLBACK');
          throw conflict('Capacity cannot be lower than already booked travellers');
        }
      }

      // Keep exact price comparison: reject no-op-priced numeric strings fine, values stored as numeric.
      if (data.price !== undefined && toCents(data.price) < 0) {
        await client.query('ROLLBACK');
        throw badRequest('price must be a non-negative number');
      }

      const updates = Object.keys(data);
      if (updates.length) {
        const sets = updates.map((k, i) => `${k} = $${i + 2}`);
        const values = updates.map((k) => data[k]);
        await client.query(
          `UPDATE journeys SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`,
          [id, ...values]
        );
      }
      const { rows: after } = await client.query(
        `SELECT j.*, ${JOURNEY_IMAGES_SQL} FROM journeys j WHERE j.id = $1`,
        [id]
      );
      await client.query('COMMIT');
      res.json({ journey: journeyToJson(after[0]) });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  })
);

// DELETE /api/journeys/:id — admin: archive (soft delete) to preserve booking history.
journeysRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid journey id');
    const { rows } = await pool.query(
      `UPDATE journeys SET status = 'archived', updated_at = now()
       WHERE id = $1 AND status <> 'archived' RETURNING id`,
      [id]
    );
    if (!rows.length) throw notFound('Journey not found or already archived');
    res.json({ ok: true });
  })
);
