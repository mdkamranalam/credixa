import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
// Enhanced connection pool configuration with additional security
const pool = new Pool({
  user: process.env.DB_USER || "credixa_admin",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "credixa_db",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  allowExitOnIdle: true,
  maxUses: 1000,
});

// Enhanced error handling for database connections
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Pool connection monitoring
pool.on('connect', (client) => {
  // Set client timeout for security
  client.query('SET statement_timeout = 5000'); // 5 second timeout
});

export default pool;
