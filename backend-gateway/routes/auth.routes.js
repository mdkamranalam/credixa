import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "super_secret_credixa_key_change_in_production";

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER || "credixa_admin",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "credixa_db",
  password: process.env.DB_PASSWORD || "admin@123",
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Simple in-memory rate limiter for registration
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

const registerRateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const records = rateLimitMap.get(ip) || [];
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    
    // Filter out old records
    const validRecords = records.filter(timestamp => timestamp > windowStart);
    
    if (validRecords.length >= MAX_REQUESTS) {
        return res.status(429).json({ error: "Too many registration attempts. Please try again later." });
    }
    
    validRecords.push(now);
    rateLimitMap.set(ip, validRecords);
    next();
};

// 1. User Registration
router.post("/register", registerRateLimiter, async (req, res) => {
  const {
    full_name,
    email,
    mobile_number,
    password,
    role,
    institution_id,
    dob,
    college_roll_number,
  } = req.body;

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
            INSERT INTO users (full_name, email, mobile_number, password_hash, role, institution_id, dob, college_roll_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING user_id, full_name, role;
        `;

    const result = await pool.query(insertQuery, [
      full_name,
      email,
      mobile_number,
      passwordHash,
      role,
      institution_id,
      dob || null,
      college_roll_number || "UNKNOWN",
    ]);

    res
      .status(201)
      .json({ message: "User registered successfully", user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      if (error.detail.includes("email"))
        return res.status(400).json({ error: "Email already exists." });
      if (error.detail.includes("mobile_number"))
        return res.status(400).json({ error: "Mobile number already exists." });
      if (error.detail.includes("pan_number"))
        return res.status(400).json({ error: "PAN Number already exists." });
    }

    if (error.code === "23514") {
      return res
        .status(400)
        .json({
          error: "Invalid PAN or Mobile format. Please check your details.",
        });
    }

    res.status(500).json({ error: "Server error during registration." });
  }
});

router.post('/register-institution', async (req, res) => {
    const { 
        name, code, contact_email, password, address, 
        bank_account_number, ifsc_code, bank_name 
    } = req.body;

    // We use a database "client" so we can perform a Transaction (BEGIN / COMMIT)
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Start Transaction

        // 1. Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // 2. Insert the College into the institutions table
        const instQuery = `
            INSERT INTO institutions (
                name, code, contact_email, password_hash, address, 
                bank_account_number, ifsc_code, bank_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING institution_id;
        `;
        const instValues = [name, code, contact_email, passwordHash, address, bank_account_number, ifsc_code, bank_name];
        const instResult = await client.query(instQuery, instValues);
        
        const newInstitutionId = instResult.rows[0].institution_id;

        // 3. Auto-Create the Admin User in the users table so they can actually log in!
        // We generate a random 10-digit mobile number just to satisfy the strict database constraints
        const dummyMobile = Math.floor(1000000000 + Math.random() * 9000000000).toString();

        const userQuery = `
            INSERT INTO users (
                full_name, email, mobile_number, password_hash, 
                role, institution_id, college_roll_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const userValues = [
            `${name} Admin`,      // Creates a name like "BITS Pilani Admin"
            contact_email,        // They will log in using their admin email
            dummyMobile,          // Fulfills the NOT NULL mobile constraint
            passwordHash,         // Same password they typed in the form
            'INSTITUTION_ADMIN',  // Sets their role perfectly
            newInstitutionId,     // Links them directly to the college we just created
            'ADMIN_ACCOUNT'       // Fills the roll number constraint
        ];
        
        await client.query(userQuery, userValues);

        await client.query('COMMIT'); // Save everything permanently!

        res.status(201).json({ message: "Institution and Admin account created perfectly!" });

    } catch (error) {
        await client.query('ROLLBACK'); // If anything fails, undo everything to protect the DB
        console.error("Institution Registration Error:", error.message);
        
        if (error.code === '23505') {
            return res.status(400).json({ error: "An institution with this code or email already exists." });
        }
        res.status(500).json({ error: "Failed to register institution." });
    } finally {
        client.release();
    }
});

router.get("/institutions", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT institution_id, name FROM institutions WHERE is_active = TRUE ORDER BY name ASC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Could not load institutions list" });
  }
});

// 2. User Login
router.post("/login", async (req, res) => {
    const {email, password} = req.body;

    try {
        const userQuery = `SELECT * FROM users WHERE email = $1;`;
        const result = await pool.query(userQuery, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({error: "Invalid email or password."});
        }

        const user = result.rows[0];

        // Compare the provided password with the stored hash
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({error: "Invalid email or password."});
        }

        // Generate the JWT Payload
        const token = jwt.sign(
          {
            id: user.user_id,
            role: user.role,
            institution_id: user.institution_id,
          },
          JWT_SECRET,
          { expiresIn: "24h" },
        ); 

        res.status(200).json({
          message: "Login successful",
          token: token,
          user: {
            id: user.user_id,
            full_name: user.full_name,
            role: user.role,
            institution_id: user.institution_id,
          },
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ error: "Failed to login." });        
    }
});

export default router;
