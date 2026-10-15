import { config } from './config.js';
import { pool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { createApp } from './app.js';

async function main() {
  await migrate();
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Journey Platform API listening on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    server.close(() => process.exit(0));
    await pool.end().catch(() => {});
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
