const { Pool } = require("pg");
require("dotenv").config();

async function testPorts() {
  for (const port of [6543, 5432]) {
    console.log(`\nTesting port ${port}...`);
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: port,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    try {
      const r = await pool.query("SELECT 1 as test");
      console.log(`Port ${port} OK:`, r.rows);
      await pool.end();
    } catch (e) {
      console.error(`Port ${port} FAIL:`, e.message);
      await pool.end();
    }
  }
}

testPorts();
