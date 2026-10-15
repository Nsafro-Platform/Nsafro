import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import {
  badRequest, unauthorized, HttpError, asyncHandler, isEmail, isNonEmptyString,
} from '../util.js';

export const authRouter = Router();

function publicUser(row) {
  return { id: row.id, email: row.email, fullName: row.full_name, role: row.role };
}

function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: config.cookieMaxAgeMs,
  });
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, fullName } = req.body || {};
    if (!isEmail(email)) throw badRequest('A valid email is required');
    if (typeof password !== 'string' || password.length < 8 || password.length > 100) {
      throw badRequest('Password must be 8-100 characters');
    }
    if (!isNonEmptyString(fullName, 200)) throw badRequest('Full name is required');

    const normalizedEmail = email.trim().toLowerCase();
    const hash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await pool.query(
        'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role',
        [normalizedEmail, hash, fullName.trim()]
      );
      setAuthCookie(res, rows[0].id);
      res.status(201).json({ user: publicUser(rows[0]) });
    } catch (err) {
      if (err.code === '23505') throw badRequest('An account with this email already exists');
      throw err;
    }
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!isEmail(email) || typeof password !== 'string') throw badRequest('Email and password are required');

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = rows[0];
    // Same generic message for unknown email and wrong password.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw unauthorized('Invalid email or password');
    }
    setAuthCookie(res, user.id);
    res.json({ user: publicUser(user) });
  })
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ---- Google sign-in (Google Identity Services ID-token flow) ----

// Public: lets the SPA render the Google button only when configured.
// Only the *public* client id is shared here — no secrets.
authRouter.get('/google/client-id', (_req, res) => {
  res.json({ clientId: config.googleClientId || null });
});

// Verifies a Google ID token against Google's tokeninfo endpoint, then signs
// the user in with the same session cookie as local auth. Only the audience
// bound to this app and verified emails are accepted; users are linked by
// their verified Google email (one account per user).
authRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const credential = req.body && typeof req.body.credential === 'string' ? req.body.credential : null;
    if (!credential) throw badRequest('Missing Google credential');
    if (!config.googleClientId) throw new HttpError(503, 'Google sign-in is not configured');

    const check = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    );
    if (!check.ok) throw unauthorized('Google token could not be verified');
    const payload = await check.json();

    const validIssuer = payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com';
    const validAudience = payload.aud === config.googleClientId;
    const validExpiry = Number(payload.exp) > Math.floor(Date.now() / 1000);
    if (!validIssuer || !validAudience || !validExpiry || payload.email_verified !== 'true') {
      throw unauthorized('Google token could not be verified');
    }

    const email = String(payload.email).toLowerCase();
    if (!isEmail(email)) throw badRequest('Google profile email is not a valid address');
    const fullName = (
      [payload.name, payload.given_name].find((n) => isNonEmptyString(n, 200)) || email.split('@')[0]
    ).trim();

    // Google users get an unusable random password hash: password login stays
    // impossible for accounts only controlled by the Google identity.
    const randomSecret = await bcrypt.hash(`${Date.now()}-${Math.random()}`, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id, email, full_name, role`,
      [email, randomSecret, fullName],
    );
    setAuthCookie(res, rows[0].id);
    res.json({ user: publicUser(rows[0]) });
  })
);
