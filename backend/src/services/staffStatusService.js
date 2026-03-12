/**
 * Staff Status Service
 * Updates the staff_status table with real-time ABSENT / TEACHING / FREE status.
 *
 * Logic:
 *   1. ABSENT  – Staff has no attendance record for today
 *   2. TEACHING – Staff is present AND:
 *        a. has a timetable class right now, OR
 *        b. has been swapped-in (recommended_staff_id) for an approved
 *           alter_request whose period is right now
 *   3. FREE   – Staff is present but not currently teaching
 */

import { pool } from '../config/db.js';

/**
 * Ensure the ABSENT value exists on the enum (idempotent).
 * Postgres doesn't have IF NOT EXISTS for ADD VALUE, but the error
 * from a duplicate add is harmless — we just catch and ignore it.
 */
async function ensureAbsentEnum() {
  try {
    await pool.query(`ALTER TYPE staff_live_status_enum ADD VALUE IF NOT EXISTS 'ABSENT'`);
  } catch (err) {
    // Postgres < 9.3 or already exists — safe to ignore
  }
}

/**
 * Upsert staff_status for every active staff member.
 */
export async function refreshStaffStatus() {
  // Make sure ABSENT is in the enum (runs once effectively)
  await ensureAbsentEnum();

  const query = `
    INSERT INTO staff_status (staff_id, current_status, free_since, last_class_end_time)
    SELECT
      s.id,

      -- ① Check attendance first
      CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM attendance a
          WHERE a.staff_id = s.id AND a.date = CURRENT_DATE
        )
        THEN 'ABSENT'::staff_live_status_enum

        -- ② Present: is this staff currently teaching their OWN class?
        WHEN EXISTS (
          SELECT 1 FROM timetable t
          WHERE t.staff_id = s.id
            AND t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
            AND t.start_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time
            AND t.end_time   >  (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time
        )
        THEN 'TEACHING'::staff_live_status_enum

        -- ③ Present: is this staff swapped-in for someone else's class right now?
        WHEN EXISTS (
          SELECT 1 FROM alter_requests ar
          WHERE ar.recommended_staff_id = s.id
            AND ar.class_date = CURRENT_DATE
            AND ar.status IN ('APPROVED', 'AUTO_APPROVED')
            AND ar.start_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time
            AND ar.end_time   >  (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time
        )
        THEN 'TEACHING'::staff_live_status_enum

        -- ④ Present but no class right now
        ELSE 'FREE'::staff_live_status_enum
      END,

      -- free_since: only meaningful when status is FREE
      CASE
        WHEN EXISTS (
          SELECT 1 FROM attendance a
          WHERE a.staff_id = s.id AND a.date = CURRENT_DATE
        )
        AND NOT EXISTS (
          SELECT 1 FROM timetable t
          WHERE t.staff_id = s.id
            AND t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
            AND t.start_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time
            AND t.end_time   >  (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time
        )
        AND NOT EXISTS (
          SELECT 1 FROM alter_requests ar
          WHERE ar.recommended_staff_id = s.id
            AND ar.class_date = CURRENT_DATE
            AND ar.status IN ('APPROVED', 'AUTO_APPROVED')
            AND ar.start_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time
            AND ar.end_time   >  (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time
        )
        THEN NOW()
        ELSE NULL
      END,

      -- last_class_end_time: most recent class that already ended today
      (
        SELECT (CURRENT_DATE + MAX(t.end_time))::timestamp
        FROM timetable t
        WHERE t.staff_id = s.id
          AND t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
          AND t.end_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time
      )

    FROM staff s
    WHERE s.is_active = true

    ON CONFLICT (staff_id)
    DO UPDATE SET
      current_status      = EXCLUDED.current_status,
      free_since          = EXCLUDED.free_since,
      last_class_end_time = EXCLUDED.last_class_end_time;
  `;

  const result = await pool.query(query);
  return result.rowCount;
}

export default { refreshStaffStatus };