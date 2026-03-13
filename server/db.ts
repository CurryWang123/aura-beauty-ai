import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || '120.25.175.116',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'juebeauty',
  user: process.env.DB_USER || 'juebeauty',
  password: process.env.DB_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
});

export default pool;
