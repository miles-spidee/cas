/**
 * Setup script: Adds password_hash column to staff table
 * and sets initial passwords for all HODs.
 *
 * Run once:  node src/database/setupAuth.js
 *
 * Default password for all HODs: "hod123" (change after first login)
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const DEFAULT_PASSWORD = "hod123";

async function setupAuth() {
  try {
    console.log("🔐 Setting up auth...\n");

    // 1. Add password_hash column if it doesn't exist
    await pool.query(`
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS password_hash TEXT
    `);
    console.log("✅ password_hash column ensured on staff table");

    // 2. Hash the default password
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 3. Set password for all HODs who don't have one yet
    const result = await pool.query(
      `UPDATE staff
       SET password_hash = $1
       WHERE role = 'HOD' AND (password_hash IS NULL OR password_hash = '')
       RETURNING id, name, email`,
      [hash]
    );

    if (result.rows.length > 0) {
      console.log(`\n🔑 Set default password for ${result.rows.length} HOD(s):\n`);
      result.rows.forEach((r) => {
        console.log(`   ${r.name} — ${r.email}`);
      });
      console.log(`\n   Default password: "${DEFAULT_PASSWORD}"`);
      console.log("   ⚠️  HODs should change this after first login.\n");
    } else {
      console.log("\n✅ All HODs already have passwords set.\n");
    }

    // 4. List all HODs for verification
    const hods = await pool.query(`
      SELECT s.name, s.email, d.name AS department,
             CASE WHEN s.password_hash IS NOT NULL THEN '✅' ELSE '❌' END AS has_password
      FROM staff s
      JOIN departments d ON d.id = s.department_id
      WHERE s.role = 'HOD'
      ORDER BY d.name
    `);

    console.log("📋 HOD accounts:");
    console.table(hods.rows);

    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

setupAuth();
