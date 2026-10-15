import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { unauthorized, forbidden } from '../util.js';

export function readToken(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// Normalise user rows to one shape for all consumers (fullName, not full_name).
function normalizeUser(row) {
  if (!row) return null;
  return { id: row.id, email: row.email, fullName: row.full_name, role: row.role };
}

export async function loadUser(req) {
  const token = readToken(req);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
  const { rows } = await pool.query(
    'SELECT id, email, full_name, role FROM users WHERE id = $1',
    [payload.sub]
  );
  return normalizeUser(rows[0]);
}

export function requireAuth(req, _res, next) {
  loadUser(req)
    .then((user) => {
      if (!user) return next(unauthorized());
      req.user = user;
      next();
    })
    .catch(next);
}

export function requireAdmin(req, _res, next) {
  loadUser(req)
    .then((user) => {
      if (!user) return next(unauthorized());
      if (user.role !== 'admin') return next(forbidden('Admin access required'));
      req.user = user;
      next();
    })
    .catch(next);
}
