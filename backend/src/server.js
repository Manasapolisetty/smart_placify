import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded before server startup
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app.js';
import { pool } from './config/database.js';

const PORT = process.env.PORT || 5000;

// Test DB connectivity before listening
pool.query('SELECT NOW()')
  .then((res) => {
    console.log(`[Database] Connected to PostgreSQL at ${res.rows[0].now}`);
    const server = app.listen(PORT, () => {
      console.log(`[SmartPlacify Backend] Server running on http://localhost:${PORT}`);
      console.log(`[Environment] Mode: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful Shutdown
    const gracefulShutdown = (signal) => {
      console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          await pool.end();
          console.log('[Database] Pool connections drained.');
          process.exit(0);
        } catch (err) {
          console.error('[Database] Error while closing pool:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('[Database] Failed to connect to PostgreSQL on startup:', err.message);
    process.exit(1);
  });
