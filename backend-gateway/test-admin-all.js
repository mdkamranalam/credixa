import axios from 'axios';
import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: 'c153e87e-a5c0-4725-a0bc-3302a399fb53', role: 'INSTITUTION_ADMIN', institution_id: '05ff2f4d-bd7f-421a-82b8-fb50e643ab5e'}, 'super_secret_credixa_key_change_in_production');
const headers = { Authorization: `Bearer ${token}` };

async function testAll() {
  try {
    const profile = await axios.get('http://localhost:3000/api/admin/institution-profile', { headers });
    console.log("Profile ok");
    const txn = await axios.get('http://localhost:3000/api/admin/transactions', { headers });
    console.log("Txns ok");
  } catch (err) {
    console.error("Error on:", err.config?.url);
    console.error(err.response ? err.response.data : err.message);
  }
}
testAll();
