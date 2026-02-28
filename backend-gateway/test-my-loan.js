import axios from 'axios';
import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: '59a84bbf-e02f-4edc-8424-ee41e2af83fd', role: 'STUDENT'}, 'super_secret_credixa_key_change_in_production');
const headers = { Authorization: `Bearer ${token}` };

async function testAll() {
  try {
    const res = await axios.get('http://localhost:3000/api/loans/my-loan', { headers });
    console.log("My loan:", res.data);
  } catch (err) {
    console.error("Error on:", err.config?.url);
    console.error(err.response ? err.response.data : err.message);
  }
}
testAll();
