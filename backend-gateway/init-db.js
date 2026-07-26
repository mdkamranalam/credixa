import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runInit() {
  const initSqlPath = path.join(__dirname, '../database/init.sql');
  const sql = fs.readFileSync(initSqlPath, 'utf8');
  try {
    console.log("Running init.sql...");
    await pool.query(sql);
    console.log("init.sql executed successfully!");
    
    // Now let's run the migrations as well so we're fully seeded
    const migrations = ['002_support_chat.sql', '003_superadmin_setup.sql', '004_seed_partner_institutions.sql', '005_password_reset.sql'];
    for (const file of migrations) {
      const p = path.join(__dirname, '../database/migrations', file);
      if (fs.existsSync(p)) {
        console.log(`Running migration ${file}...`);
        const migSql = fs.readFileSync(p, 'utf8');
        await pool.query(migSql);
        console.log(`Migration ${file} executed successfully!`);
      }
    }
  } catch (err) {
    console.error("Error executing SQL:", err.message);
  } finally {
    await pool.end();
  }
}
runInit();
