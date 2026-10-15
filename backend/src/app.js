import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { HttpError } from './util.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { journeysRouter } from './routes/journeys.js';
import { bookingsRouter } from './routes/bookings.js';
import { optionsRouter } from './routes/options.js';
import { itinerariesRouter } from './routes/itineraries.js';
import { adminRouter } from './routes/admin.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/journeys', journeysRouter);
  app.use('/api/options', optionsRouter);
  app.use('/api/itineraries', itinerariesRouter);
  app.use('/api/bookings', bookingsRouter); // includes /api/bookings/admin/all
  app.use('/api/admin', adminRouter);

  // Consistent 404 for unknown API routes.
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')));

  // Central error handler: consistent JSON errors, no internal detail leakage.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
