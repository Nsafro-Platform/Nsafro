import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import {
  badRequest, notFound, conflict, forbidden, asyncHandler,
  isNonEmptyString, isPositiveInt, toCents, centsToDecimalString,
} from '../util.js';

export const itinerariesRouter = Router();

// Load a draft with items and a server-computed total from trusted option prices.
async function loadItinerary(client, id, userId) {
  const { rows } = await client.query('SELECT * FROM itineraries WHERE id = $1', [id]);
  const itinerary = rows[0];
  if (!itinerary) throw notFound('Itinerary not found');
  if (itinerary.user_id !== userId) throw forbidden('Not your itinerary');

  const { rows: itemRows } = await client.query(
    `SELECT ii.id, ii.option_id, ii.quantity, o.name, o.category, o.description, o.price
     FROM itinerary_items ii JOIN journey_options o ON o.id = ii.option_id
     WHERE ii.itinerary_id = $1 ORDER BY o.category, o.name`,
    [id]
  );
  const items = itemRows.map((r) => ({
    id: r.id,
    optionId: r.option_id,
    quantity: r.quantity,
    name: r.name,
    category: r.category,
    description: r.description,
    price: r.price,
    lineTotal: centsToDecimalString(toCents(r.price) * r.quantity),
  }));
  const totalCents = itemRows.reduce((sum, r) => sum + toCents(r.price) * r.quantity, 0);
  return { itinerary, items, totalCents };
}

function itineraryToJson(itinerary, items, totalCents) {
  return {
    id: itinerary.id,
    title: itinerary.title,
    status: itinerary.status,
    createdAt: itinerary.created_at,
    updatedAt: itinerary.updated_at,
    items,
    totalPrice: centsToDecimalString(totalCents),
  };
}

// POST /api/itineraries — create an empty draft.
itinerariesRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const title = req.body && isNonEmptyString(req.body.title, 200) ? req.body.title.trim() : 'My journey';
    const { rows } = await pool.query(
      'INSERT INTO itineraries (user_id, title) VALUES ($1, $2) RETURNING *',
      [req.user.id, title]
    );
    res.status(201).json({ itinerary: itineraryToJson(rows[0], [], 0) });
  })
);

// GET /api/itineraries — the signed-in user's drafts.
itinerariesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT * FROM itineraries WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json({
      itineraries: rows.map((r) => itineraryToJson(r, [], 0)),
    });
  })
);

// GET /api/itineraries/:id — owner only, with recalculated items and total.
itinerariesRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid itinerary id');
    const { itinerary, items, totalCents } = await loadItinerary(pool, id, req.user.id);
    res.json({ itinerary: itineraryToJson(itinerary, items, totalCents) });
  })
);

// PUT /api/itineraries/:id — replace draft content (title + items) and recompute total server-side.
itinerariesRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid itinerary id');
    const body = req.body || {};
    const itemsInput = Array.isArray(body.items) ? body.items : [];

    for (const item of itemsInput) {
      if (!isPositiveInt(Number(item.optionId))) throw badRequest('each item needs a valid optionId');
      if (!isPositiveInt(Number(item.quantity))) throw badRequest('each item needs a positive quantity');
      if (Number(item.quantity) > 50) throw badRequest('quantity is limited to 50 per option');
    }
    const title = isNonEmptyString(body.title, 200) ? body.title.trim() : undefined;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM itineraries WHERE id = $1 FOR UPDATE', [id]);
      const existing = rows[0];
      if (!existing) { await client.query('ROLLBACK'); throw notFound('Itinerary not found'); }
      if (existing.user_id !== req.user.id) { await client.query('ROLLBACK'); throw forbidden('Not your itinerary'); }
      if (existing.status !== 'draft') {
        await client.query('ROLLBACK');
        throw conflict('Submitted itineraries cannot be edited; create a new draft');
      }

      await client.query(
        `UPDATE itineraries SET title = COALESCE($2, title), updated_at = now() WHERE id = $1`,
        [id, title || null]
      );
      await client.query('DELETE FROM itinerary_items WHERE itinerary_id = $1', [id]);
      for (const item of itemsInput) {
        const { rows: opt } = await client.query('SELECT id FROM journey_options WHERE id = $1', [
          Number(item.optionId),
        ]);
        if (!opt.length) { await client.query('ROLLBACK'); throw badRequest(`Unknown option ${item.optionId}`); }
        await client.query(
          'INSERT INTO itinerary_items (itinerary_id, option_id, quantity) VALUES ($1, $2, $3)',
          [id, Number(item.optionId), Number(item.quantity)]
        );
      }
      const loaded = await loadItinerary(client, id, req.user.id);
      await client.query('COMMIT');
      res.json({ itinerary: itineraryToJson(loaded.itinerary, loaded.items, loaded.totalCents) });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  })
);

// POST /api/itineraries/:id/quote — submit this draft as a quote request for agent review.
itinerariesRouter.post(
  '/:id/quote',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid itinerary id');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM itineraries WHERE id = $1 FOR UPDATE', [id]);
      const itinerary = rows[0];
      if (!itinerary) { await client.query('ROLLBACK'); throw notFound('Itinerary not found'); }
      if (itinerary.user_id !== req.user.id) { await client.query('ROLLBACK'); throw forbidden('Not your itinerary'); }
      if (itinerary.status === 'submitted') {
        await client.query('ROLLBACK');
        throw conflict('A quote request was already submitted for this itinerary');
      }

      await client.query(`UPDATE itineraries SET status = 'submitted', updated_at = now() WHERE id = $1`, [id]);

      let quote;
      const { rows: existingQuote } = await client.query(
        'SELECT * FROM quote_requests WHERE itinerary_id = $1', [id]
      );
      if (existingQuote.length) {
        ({ rows: [quote] } = await client.query(
          `UPDATE quote_requests SET status = 'submitted', updated_at = now() WHERE id = $1 RETURNING *`,
          [existingQuote[0].id]
        ));
      } else {
        ({ rows: [quote] } = await client.query(
          'INSERT INTO quote_requests (itinerary_id, user_id) VALUES ($1, $2) RETURNING *',
          [id, req.user.id]
        ));
      }

      const loaded = await loadItinerary(client, id, req.user.id);
      await client.query('COMMIT');
      res.status(201).json({
        quoteRequest: {
          id: quote.id,
          status: quote.status,
          itinerary: itineraryToJson(loaded.itinerary, loaded.items, loaded.totalCents),
        },
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  })
);
