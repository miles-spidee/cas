/**
 * Seed Script - Insert 10 Attendance Records
 * Run: node src/database/seedAttendance.js
 * Prerequisites: Staff table must have records
 */

import 'dotenv/config';
import { pool } from '../config/db.js';

async function seedAttendance() {
  try {
    console.log('🌱 Starting attendance seeding...\n');

    // ============ STEP 1: INSERT 10 ATTENDANCE RECORDS ============
    console.log('📋 Step 1: Inserting 10 random attendance records...');
    
    const attendanceInsertQuery = `
      INSERT INTO attendance (staff_id, date, check_in, status)
      SELECT
        staff_id,
        date,
        check_in,
        status
      FROM (
        WITH random_staff AS (
          SELECT id FROM staff ORDER BY random() LIMIT 10
        ),
        dates_list AS (
          SELECT 
            random_staff.id as staff_id,
            CURRENT_DATE - (floor(random() * 10)::int) as date
          FROM random_staff
        )
        SELECT
          dates_list.staff_id,
          dates_list.date,
          (floor(random() * 24)::int || ':' || lpad((floor(random() * 60)::int)::text, 2, '0') || ':00')::time as check_in,
          CASE 
            WHEN random() < 0.2 THEN 'ABSENT'
            ELSE 'PRESENT'
          END as status
        FROM dates_list
      ) AS v
      RETURNING id, staff_id, date, check_in, status;
    `;

    const attendanceResult = await pool.query(attendanceInsertQuery);
    console.log(`✅ Inserted ${attendanceResult.rows.length} attendance records\n`);

    // ============ STEP 2: VERIFY ATTENDANCE DATA ============
    console.log('🔍 Verification: Attendance Data');
    console.log('═'.repeat(80));
    
    const attendanceVerifyQuery = `
      SELECT 
        a.id,
        s.name AS "Staff Name",
        a.date AS "Date",
        a.check_in AS "Check-in Time",
        a.status AS "Status"
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.date >= CURRENT_DATE - 10
      ORDER BY a.date DESC, s.name
      LIMIT 10;
    `;

    const attendanceVerify = await pool.query(attendanceVerifyQuery);
    console.log(`Total Attendance Records Inserted: ${attendanceVerify.rows.length}\n`);
    console.table(attendanceVerify.rows);

    // ============ STEP 3: SUMMARY STATISTICS ============
    console.log('\n📊 Summary Statistics');
    console.log('═'.repeat(80));

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM attendance WHERE date >= CURRENT_DATE - 10) as total_records,
        (SELECT COUNT(*) FROM attendance WHERE date >= CURRENT_DATE - 10 AND check_in IS NOT NULL) as present_count,
        (SELECT COUNT(*) FROM attendance WHERE date >= CURRENT_DATE - 10 AND check_in IS NULL) as absent_count,
        (SELECT COUNT(DISTINCT staff_id) FROM attendance WHERE date >= CURRENT_DATE - 10) as unique_staff_count;
    `;

    const stats = await pool.query(statsQuery);
    const statsRow = stats.rows[0];
    
    console.log(`Total Attendance Records: ${statsRow.total_records}`);
    console.log(`  - Present: ${statsRow.present_count}`);
    console.log(`  - Absent: ${statsRow.absent_count}`);
    console.log(`Unique Staff Members: ${statsRow.unique_staff_count}\n`);

    console.log('✨ ✨ ✨ Attendance seeding completed successfully! ✨ ✨ ✨\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedAttendance();
