import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const res = await pool.query("SELECT count(*) FROM users");
    console.log("Users count:", res.rows[0].count);
    
    const admin = await pool.query("SELECT * FROM users WHERE email = 'superadmin@credixa.com'");
    console.log("Superadmin exists?", admin.rows.length > 0);
  } catch (err) {
    console.error("Error querying database:", err.message);
  } finally {
    await pool.end();
  }
}
test();
