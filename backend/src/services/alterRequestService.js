/**
 * Alter Request Service
 * Auto-generates PENDING alter_requests for absent staff's scheduled classes today.
 * Uses the same logic as POST /api/hod/generate-alter-requests but callable from cron.
 */

import { pool } from '../config/db.js';

/**
 * Insert PENDING alter_requests for every class whose teacher has no
 * attendance record today.  ON CONFLICT ensures we don't create duplicates.
 *
 * @returns {number} Number of new rows inserted
 */
export async function generateAlterRequests() {
  // Guard: only generate alter_requests if attendance has been taken today.
  // If zero attendance records exist, we can't know who's absent yet.
  const attendanceCheck = await pool.query(
    `SELECT COUNT(*) AS count FROM attendance WHERE date = CURRENT_DATE`
  );
  const attendanceCount = parseInt(attendanceCheck.rows[0].count, 10);
  if (attendanceCount === 0) {
    return 0; // No attendance yet — skip
  }

  const query = `
    INSERT INTO alter_requests (
      id,
      absent_staff_id,
      class_name,
      subject,
      class_date,
      start_time,
      end_time,
      department_id,
      status,
      created_at,
      expires_at
    )
    SELECT
      gen_random_uuid(),
      t.staff_id,
      t.class_name,
      t.subject,
      CURRENT_DATE,
      t.start_time,
      t.end_time,
      s.department_id,
      'PENDING',
      NOW(),
      NOW() + INTERVAL '15 minutes'
    FROM timetable t
    JOIN staff s ON s.id = t.staff_id
    WHERE t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
      AND NOT EXISTS (
        SELECT 1
        FROM attendance a
        WHERE a.staff_id = t.staff_id
          AND a.date = CURRENT_DATE
      )
    ON CONFLICT (class_name, class_date, start_time) DO NOTHING
  `;

  const result = await pool.query(query);
  return result.rowCount;
}

/**
 * Clean up stale alter_requests — remove PENDING requests for staff
 * who actually have an attendance record today (i.e. they're present,
 * not absent). This handles the case where alter_requests were created
 * before attendance was fully recorded, or if a staff member checks in late.
 *
 * Only deletes PENDING ones — APPROVED/MODIFIED are kept since a swap
 * was already arranged.
 *
 * @returns {number} Number of stale rows deleted
 */
export async function cleanupStaleAlterRequests() {
  // If no attendance has been recorded today at all,
  // delete ALL PENDING alter_requests (we can't know who's absent)
  const attendanceCheck = await pool.query(
    `SELECT COUNT(*) AS count FROM attendance WHERE date = CURRENT_DATE`
  );
  const attendanceCount = parseInt(attendanceCheck.rows[0].count, 10);

  let query;
  if (attendanceCount === 0) {
    // No attendance yet — all PENDING alter_requests are premature
    query = `
      DELETE FROM alter_requests
      WHERE class_date = CURRENT_DATE
        AND status = 'PENDING'
    `;
  } else {
    // Attendance exists — only remove PENDING requests for staff who are actually present
    query = `
      DELETE FROM alter_requests
      WHERE class_date = CURRENT_DATE
        AND status = 'PENDING'
        AND EXISTS (
          SELECT 1
          FROM attendance a
          WHERE a.staff_id = alter_requests.absent_staff_id
            AND a.date = CURRENT_DATE
        )
    `;
  }

  const result = await pool.query(query);
  return result.rowCount;
}

export default { generateAlterRequests, cleanupStaleAlterRequests };
