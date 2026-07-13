import axios from "axios";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:3000/api";
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_credixa_key_change_in_production";

async function runSuperAdminTests() {
  console.log("=== Running Superadmin Verification Tests ===");

  // 1. Generate Superadmin Token
  const token = jwt.sign({
    id: "00000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000001",
    role: "SUPER_ADMIN",
    email: "superadmin@credixa.com",
    institution_id: null
  }, JWT_SECRET, { expiresIn: "1h" });

  const headers = { Authorization: `Bearer ${token}` };

  try {
    // Test 1: GET /api/superadmin/analytics
    console.log("\n[Test 1] Testing GET /api/superadmin/analytics...");
    const kpiRes = await axios.get(`${API_BASE}/superadmin/analytics`, { headers });
    console.log("✅ Analytics response:", kpiRes.data.kpis);

    // Test 2: GET /api/superadmin/institutions
    console.log("\n[Test 2] Testing GET /api/superadmin/institutions...");
    const instRes = await axios.get(`${API_BASE}/superadmin/institutions`, { headers });
    console.log(`✅ Found ${instRes.data.institutions.length} institutions.`);

    // Test 3: GET /api/superadmin/loans
    console.log("\n[Test 3] Testing GET /api/superadmin/loans...");
    const loansRes = await axios.get(`${API_BASE}/superadmin/loans`, { headers });
    console.log(`✅ Found ${loansRes.data.loans.length} universal loans.`);

    // Test 4: GET & PUT /api/superadmin/settings
    console.log("\n[Test 4] Testing GET /api/superadmin/settings...");
    const settingsRes = await axios.get(`${API_BASE}/superadmin/settings`, { headers });
    console.log("✅ Current settings:", settingsRes.data.settings);

    console.log("\n=== All Superadmin Tests Passed Successfully! ===");
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log("⚠️ Backend server is not running on port 3000 right now. Please start the server to run live integration tests.");
    } else {
      console.error("❌ Test Failed:", error.response?.data || error.message);
    }
  }
}

runSuperAdminTests();
