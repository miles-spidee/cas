/**
 * Alter Request Service
 * Auto-generates PENDING alter_requests for absent staff's scheduled classes today.
 * Uses the same logic as POST /api/hod/generate-alter-requests but callable from cron.
 */

import { pool } from '../config/db.js';

/**
 * Insert PENDING alter_requests for every class whose teacher has no
 * attendance record today. ON CONFLICT ensures we don't create duplicates.
 * Then auto-assigns the top recommended staff (highest free_minutes).
 *
 * @returns {object} { inserted: count, assigned: count }
 */
export async function generateAlterRequests() {
  // Guard: only generate alter_requests if attendance has been taken today.
  // If zero attendance records exist, we can't know who's absent yet.
  const attendanceCheck = await pool.query(
    `SELECT COUNT(*) AS count FROM attendance WHERE date = CURRENT_DATE`
  );
  const attendanceCount = parseInt(attendanceCheck.rows[0].count, 10);
  if (attendanceCount === 0) {
    return { inserted: 0, assigned: 0 }; // No attendance yet — skip
  }

  const insertQuery = `
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

  const insertResult = await pool.query(insertQuery);
  const inserted = insertResult.rowCount;

  // ── Auto-assign top recommended staff ──
  // For each PENDING alter_request without a recommended_staff_id,
  // find the top candidate (most free time) and assign them
  const assignQuery = `
    WITH pending_requests AS (
      SELECT ar.id, ar.absent_staff_id, ar.start_time, ar.end_time, ar.department_id
      FROM alter_requests ar
      WHERE ar.class_date = CURRENT_DATE
        AND ar.status = 'PENDING'
        AND ar.recommended_staff_id IS NULL
    ),
    top_candidates AS (
      SELECT DISTINCT ON (pr.id)
        pr.id AS alter_request_id,
        s.id AS candidate_id
      FROM pending_requests pr
      JOIN staff s ON s.department_id = pr.department_id
      WHERE s.id != pr.absent_staff_id
        AND s.is_active = true
        -- No timetable conflict
        AND NOT EXISTS (
          SELECT 1 FROM timetable t
          WHERE t.staff_id = s.id
            AND t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
            AND t.start_time < pr.end_time
            AND t.end_time > pr.start_time
        )
        -- Not absent
        AND NOT EXISTS (
          SELECT 1 FROM alter_requests ar2
          WHERE ar2.absent_staff_id = s.id
            AND ar2.class_date = CURRENT_DATE
        )
      ORDER BY pr.id,
        COALESCE(
          (SELECT MAX(t.end_time)
           FROM timetable t
           WHERE t.staff_id = s.id
             AND t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
             AND t.end_time <= pr.start_time),
          '09:00:00'::time
        ) DESC  -- Highest free_minutes first
    )
    UPDATE alter_requests ar
    SET recommended_staff_id = tc.candidate_id
    FROM top_candidates tc
    WHERE ar.id = tc.alter_request_id
    RETURNING ar.id
  `;

  const assignResult = await pool.query(assignQuery);
  const assigned = assignResult.rowCount;

  return { inserted, assigned };
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
