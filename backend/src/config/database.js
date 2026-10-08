import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

// Determine SSL requirement: Cloud PostgreSQL (Neon, Supabase, Render, Railway, AWS RDS) requires SSL
const isProduction = process.env.NODE_ENV === 'production';
const sslExplicit = process.env.DB_SSL ? process.env.DB_SSL === 'true' : null;
const useSsl = sslExplicit !== null ? sslExplicit : (isProduction || Boolean(process.env.DATABASE_URL));

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'smartplacify_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

/**
 * Reusable parameterized query execution helper
 * @param {string} text - SQL query text
 * @param {Array} params - Parameter array
 */
export const query = (text, params) => pool.query(text, params);

export default pool;
