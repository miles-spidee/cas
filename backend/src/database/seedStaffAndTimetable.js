/**
 * Seed Script - Insert 20 Staff & Timetable Entries
 * Run: node src/database/seedStaffAndTimetable.js
 */

import 'dotenv/config';
import { pool } from '../config/db.js';

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // ============ STEP 1: INSERT 20 STAFF MEMBERS ============
    console.log('📝 Step 1: Inserting 20 staff members...');
    
    const staffInsertQuery = `
      INSERT INTO staff (name, email, rfid, department_id, role, is_active)
      SELECT
        name,
        email,
        concat('RF', to_char((floor(random() * 9999999))::bigint, 'FM0000000')) as rfid,
        (SELECT id FROM departments ORDER BY random() LIMIT 1) AS department_id,
        CASE WHEN random() < 0.15 THEN 'HOD' ELSE 'STAFF' END AS role,
        TRUE AS is_active
      FROM (VALUES
        ('Dr. Amelia Foster',          'amelia.foster@institution.edu'),
        ('Prof. Benjamin Clarke',      'benjamin.clarke@institution.edu'),
        ('Dr. Charlotte Mitchell',     'charlotte.mitchell@institution.edu'),
        ('Prof. David Thompson',       'david.thompson@institution.edu'),
        ('Dr. Eleanor Watson',         'eleanor.watson@institution.edu'),
        ('Prof. Felix Rodriguez',      'felix.rodriguez@institution.edu'),
        ('Dr. Grace Lee',              'grace.lee@institution.edu'),
        ('Prof. Henry Patel',          'henry.patel@institution.edu'),
        ('Dr. Iris Johnson',           'iris.johnson@institution.edu'),
        ('Prof. James Martinez',       'james.martinez@institution.edu'),
        ('Dr. Katherine Brown',        'katherine.brown@institution.edu'),
        ('Prof. Lucas Anderson',       'lucas.anderson@institution.edu'),
        ('Dr. Mia Wilson',             'mia.wilson@institution.edu'),
        ('Prof. Nathan Davis',         'nathan.davis@institution.edu'),
        ('Dr. Olivia Harris',          'olivia.harris@institution.edu'),
        ('Prof. Paul Garcia',          'paul.garcia@institution.edu'),
        ('Dr. Quinn Taylor',           'quinn.taylor@institution.edu'),
        ('Prof. Rachel White',         'rachel.white@institution.edu'),
        ('Dr. Samuel Green',           'samuel.green@institution.edu'),
        ('Prof. Tara Lopez',           'tara.lopez@institution.edu')
      ) AS v(name, email)
      RETURNING id, name, email, rfid, department_id, role;
    `;

    const staffResult = await pool.query(staffInsertQuery);
    console.log(`✅ Inserted ${staffResult.rows.length} staff members\n`);

    // ============ STEP 2: INSERT 20 TIMETABLE ENTRIES ============
    console.log('📅 Step 2: Inserting 20 timetable entries...');

    const timetableInsertQuery = `
      INSERT INTO timetable (staff_id, class_name, subject, day, start_time, end_time)
      SELECT
        staff_id,
        class_name,
        subject,
        day,
        start_time,
        end_time
      FROM (
        WITH random_staff AS (
          SELECT id FROM staff 
          WHERE email LIKE '%@institution.edu'
          ORDER BY random() 
          LIMIT 20
        ),
        numbered_staff AS (
          SELECT id, row_number() OVER (ORDER BY id) as rn FROM random_staff
        )
        SELECT
          ns.id AS staff_id,
          class_names.class_name,
          subjects.subject,
          ((ns.rn - 1) % 5 + 1) AS day,
          times.start_time,
          times.end_time
        FROM numbered_staff ns
        CROSS JOIN LATERAL (
          SELECT class_name FROM (VALUES
            ('CSE-A'), ('CSE-B'), ('ECE-A'), ('ECE-B'), ('MECH-A'), ('MECH-B'), 
            ('CIVIL-A'), ('CIVIL-B'), ('EEE-A'), ('EEE-B')
          ) t(class_name)
          ORDER BY random() LIMIT 1
        ) class_names
        CROSS JOIN LATERAL (
          SELECT subject FROM (VALUES
            ('Data Structures'), ('Web Development'), ('Database Systems'), 
            ('Operating Systems'), ('Computer Networks'), ('Algorithms'), 
            ('Machine Learning'), ('Cloud Computing'), ('Mobile Development'), 
            ('Software Engineering')
          ) t(subject)
          ORDER BY random() LIMIT 1
        ) subjects
        CROSS JOIN LATERAL (
          SELECT start_time, end_time FROM (VALUES
            ('09:00:00'::time, '10:30:00'::time),
            ('10:30:00'::time, '12:00:00'::time),
            ('13:00:00'::time, '14:30:00'::time),
            ('14:30:00'::time, '16:00:00'::time),
            ('16:00:00'::time, '17:30:00'::time)
          ) t(start_time, end_time)
          ORDER BY random() LIMIT 1
        ) times
      ) AS v
      RETURNING id, staff_id, class_name, subject, day, start_time, end_time;
    `;

    const timetableResult = await pool.query(timetableInsertQuery);
    console.log(`✅ Inserted ${timetableResult.rows.length} timetable entries\n`);

    // ============ STEP 3: VERIFY STAFF DATA ============
    console.log('🔍 Verification 1: Staff Data');
    console.log('═'.repeat(80));
    
    const staffVerifyQuery = `
      SELECT id, name, email, rfid, department_id, role, is_active
      FROM staff 
      WHERE email LIKE '%@institution.edu'
      ORDER BY name
      LIMIT 20;
    `;

    const staffVerify = await pool.query(staffVerifyQuery);
    console.log(`Total Staff Inserted: ${staffVerify.rows.length}\n`);
    console.table(staffVerify.rows);

    // ============ STEP 4: VERIFY TIMETABLE DATA ============
    console.log('\n🔍 Verification 2: Timetable Data');
    console.log('═'.repeat(80));

    const timetableVerifyQuery = `
      SELECT 
        s.name AS "Staff Name",
        t.class_name AS "Class",
        t.subject AS "Subject",
        CASE 
          WHEN t.day = 1 THEN 'Monday'
          WHEN t.day = 2 THEN 'Tuesday'
          WHEN t.day = 3 THEN 'Wednesday'
          WHEN t.day = 4 THEN 'Thursday'
          WHEN t.day = 5 THEN 'Friday'
        END AS "Day",
        t.start_time AS "Start Time",
        t.end_time AS "End Time"
      FROM timetable t
      JOIN staff s ON t.staff_id = s.id
      WHERE s.email LIKE '%@institution.edu'
      ORDER BY s.name, t.day, t.start_time
      LIMIT 20;
    `;

    const timetableVerify = await pool.query(timetableVerifyQuery);
    console.log(`Total Timetable Entries: ${timetableVerify.rows.length}\n`);
    console.table(timetableVerify.rows);

    // ============ STEP 5: SUMMARY STATISTICS ============
    console.log('\n📊 Summary Statistics');
    console.log('═'.repeat(80));

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM staff WHERE email LIKE '%@institution.edu') as total_staff,
        (SELECT COUNT(*) FROM staff WHERE email LIKE '%@institution.edu' AND role = 'HOD') as hod_count,
        (SELECT COUNT(*) FROM staff WHERE email LIKE '%@institution.edu' AND role = 'STAFF') as staff_count,
        (SELECT COUNT(*) FROM timetable t 
         JOIN staff s ON t.staff_id = s.id 
         WHERE s.email LIKE '%@institution.edu') as total_timetable_entries;
    `;

    const stats = await pool.query(statsQuery);
    const statsRow = stats.rows[0];
    
    console.log(`Total Staff Members: ${statsRow.total_staff}`);
    console.log(`  - HODs: ${statsRow.hod_count}`);
    console.log(`  - Staff: ${statsRow.staff_count}`);
    console.log(`Total Timetable Entries: ${statsRow.total_timetable_entries}\n`);

    console.log('✨ ✨ ✨ Seeding completed successfully! ✨ ✨ ✨\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
