import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler, badRequest } from '../util.js';

export const optionsRouter = Router();

function optionToJson(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    price: row.price,
  };
}

// GET /api/options?category=transport|accommodation|activity
optionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const valid = ['transport', 'accommodation', 'activity'];
    let rows;
    if (req.query.category) {
      if (!valid.includes(String(req.query.category))) throw badRequest('Invalid category filter');
      ({ rows } = await pool.query('SELECT * FROM journey_options WHERE category = $1 ORDER BY id', [
        req.query.category,
      ]));
    } else {
      ({ rows } = await pool.query('SELECT * FROM journey_options ORDER BY category, id'));
    }
    res.json({ options: rows.map(optionToJson) });
  })
);
