require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

async function run() {
  const [username, password, roleArg] = process.argv.slice(2);
  if (!username || !password) {
    // eslint-disable-next-line no-console
    console.error('Usage: node scripts/create-admin.js <username> <password> [role]');
    process.exit(1);
  }

  const role = roleArg === 'user' ? 'user' : 'admin';
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [response] = await pool.execute(
      'INSERT INTO users (username, password_hash, role, is_active) VALUES (:username, :password_hash, :role, 1)',
      { username, password_hash: passwordHash, role }
    );
    // eslint-disable-next-line no-console
    console.log(`Created user ${username} with id ${response.insertId}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create user', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
