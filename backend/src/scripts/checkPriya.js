import { query } from '../config/database.js';

async function check() {
  const user = await query("SELECT * FROM users WHERE email = 'priya.sharma@techcorp.com'");
  console.log('User:', user.rows[0]);
  const rec = await query("SELECT * FROM recruiters WHERE user_id = $1 OR id = $1", [user.rows[0].id]);
  console.log('Recruiter:', rec.rows);
  const comp = await query("SELECT * FROM companies LIMIT 2");
  console.log('Company:', comp.rows);
  process.exit(0);
}

check();
