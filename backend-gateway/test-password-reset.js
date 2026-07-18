import fetch from "node-fetch";

const API_BASE = "http://localhost:3000/api";
let superAdminToken = "";
let dummyUserEmail = "testuser_reset@example.com";
let resetRequestId = "";

async function loginSuperadmin() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "superadmin@credixa.com", password: "SuperAdmin@2026!" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Superadmin login failed: " + JSON.stringify(data));
  superAdminToken = data.token;
  console.log("✅ Superadmin logged in.");
}

async function registerDummyUser() {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Test User Reset",
      email: dummyUserEmail,
      mobile_number: "9999999998",
      password: "OldPassword123!",
      college_roll_number: "TEST-01"
    })
  });
  const data = await res.json();
  if (!res.ok && data.error !== "Email already exists." && data.error !== "Mobile number already exists.") {
    throw new Error("Register failed: " + JSON.stringify(data));
  }
  console.log("✅ Dummy user ready.");
}

async function requestPasswordReset() {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: dummyUserEmail })
  });
  const data = await res.json();
  console.log("Forgot Password Request:", data.message);
  
  // Try again to trigger duplicate prevention
  const res2 = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: dummyUserEmail })
  });
  const data2 = await res2.json();
  console.log("Forgot Password Duplicate Request:", data2.message);
}

async function getAndApproveRequest() {
  const res = await fetch(`${API_BASE}/superadmin/password-resets`, {
    headers: { "Authorization": `Bearer ${superAdminToken}` }
  });
  const data = await res.json();
  const req = data.requests.find(r => r.email === dummyUserEmail && r.status === 'PENDING');
  if (!req) {
     console.log("No pending request found for dummy user.");
     return;
  }
  resetRequestId = req.request_id;
  console.log(`Found pending request: ${resetRequestId}`);

  const approveRes = await fetch(`${API_BASE}/superadmin/password-resets/${resetRequestId}/approve`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${superAdminToken}` }
  });
  const approveData = await approveRes.json();
  console.log("Approve Response:", approveData.message);
}

async function executePasswordReset() {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: dummyUserEmail, new_password: "NewPassword456!" })
  });
  const data = await res.json();
  console.log("Reset Password Response:", data.message || data.error);
}

async function verifyNewLogin() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: dummyUserEmail, password: "NewPassword456!" })
  });
  const data = await res.json();
  if (res.ok) {
    console.log("✅ Successfully logged in with NEW password!");
  } else {
    console.log("❌ Failed to log in with new password:", data.error);
  }
}

async function runTest() {
  try {
    await loginSuperadmin();
    await registerDummyUser();
    await requestPasswordReset();
    await getAndApproveRequest();
    await executePasswordReset();
    await verifyNewLogin();
  } catch (err) {
    console.error(err);
  }
}

runTest();
