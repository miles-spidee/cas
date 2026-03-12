import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

/**
 * GET /api/hod/absent-staff
 * Returns staff whose current_status is ABSENT in staff_status table
 * Scoped to the logged-in HOD's department
 */
router.get("/absent-staff", async (req, res) => {
  try {
    const dept = req.user.department_id;

    // First check if staff_status has been populated at all
    const statusCountResult = await pool.query(
      `SELECT COUNT(*) as count FROM staff_status`
    );
    const hasStatusData = parseInt(statusCountResult.rows[0].count, 10) > 0;

    if (!hasStatusData) {
      return res.json({
        rows: [],
        message: "Staff status not yet computed — waiting for cron refresh"
      });
    }

    // Check if everyone in this dept is ABSENT (meaning attendance hasn't been taken yet)
    const absentCountResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE ss.current_status = 'ABSENT') AS absent_count,
         COUNT(*) AS total_count
       FROM staff_status ss
       JOIN staff s ON s.id = ss.staff_id
       WHERE s.is_active = true AND s.department_id = $1`,
      [dept]
    );
    const { absent_count, total_count } = absentCountResult.rows[0];
    if (parseInt(absent_count, 10) === parseInt(total_count, 10) && parseInt(total_count, 10) > 0) {
      return res.json({
        rows: [],
        message: "Attendance not yet recorded for today"
      });
    }

    const query = `
      SELECT s.id, s.name, ss.current_status
      FROM staff s
      JOIN staff_status ss ON ss.staff_id = s.id
      WHERE s.department_id = $1
        AND ss.current_status = 'ABSENT'
      ORDER BY s.name
    `;

    const result = await pool.query(query, [dept]);
    res.json({ rows: result.rows });
  } catch (error) {
    console.error("Error fetching absent staff:", error);
    res.status(500).json({ error: "Failed to fetch absent staff", detail: error.message });
  }
});

/**
 * POST /api/hod/generate-alter-requests
 * Auto-creates PENDING alter_requests for all affected classes today.
 * Uses ON CONFLICT to skip classes that already have an alter_request.
 */
router.post("/generate-alter-requests", async (req, res) => {
  try {
    // Guard: only generate alter_requests if attendance has been taken today.
    // If zero attendance records exist, we can't know who's absent yet.
    const attendanceCheck = await pool.query(
      `SELECT COUNT(*) AS count FROM attendance WHERE date = CURRENT_DATE`
    );
    const attendanceCount = parseInt(attendanceCheck.rows[0].count, 10);
    if (attendanceCount === 0) {
      return res.json({
        message: "Attendance not yet recorded — skipping alter request generation",
        inserted: 0,
      });
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
    res.json({
      message: "Alter requests generated",
      inserted: result.rowCount,
    });
  } catch (error) {
    console.error("Error generating alter requests:", error);
    res.status(500).json({ error: "Failed to generate alter requests", detail: error.message });
  }
});

/**
 * GET /api/hod/affected-classes
 * Returns today's alter_requests with absent teacher info and assigned swap (if any)
 * Scoped to the logged-in HOD's department
 */
router.get("/affected-classes", async (req, res) => {
  try {
    const dept = req.user.department_id;

    const query = `
      SELECT
        ar.id AS alter_request_id,
        ar.class_name,
        ar.subject,
        ar.start_time,
        ar.end_time,
        ar.absent_staff_id,
        sa.name AS absent_teacher,
        ar.status,
        ar.recommended_staff_id,
        sr.name AS assigned_staff_name,
        ar.expires_at,
        -- live period status based on current time
        CASE
          WHEN ar.end_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time THEN 'COMPLETED'
          WHEN ar.start_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time AND ar.end_time > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time THEN 'ONGOING'
          ELSE 'UPCOMING'
        END AS period_status,
        -- how was the assignment approved
        CASE
          WHEN ar.status = 'AUTO_APPROVED' THEN 'Auto'
          WHEN ar.status IN ('APPROVED', 'MODIFIED') THEN 'HOD'
          ELSE NULL
        END AS approval_method,
        approver.name AS approved_by_name
      FROM alter_requests ar
      JOIN staff sa ON sa.id = ar.absent_staff_id
      LEFT JOIN staff sr ON sr.id = ar.recommended_staff_id
      LEFT JOIN staff approver ON approver.id = ar.approved_by
      WHERE ar.class_date = CURRENT_DATE
        AND ar.department_id = $1
      ORDER BY
        CASE
          WHEN ar.end_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time THEN 2
          WHEN ar.start_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time AND ar.end_time > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::time THEN 0
          ELSE 1
        END,
        ar.start_time,
        ar.class_name
    `;

    const result = await pool.query(query, [dept]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching affected classes:", error);
    res.status(500).json({ error: "Failed to fetch affected classes" });
  }
});

/**
 * GET /api/hod/swap-candidates
 * Returns available staff who can substitute for an absent teacher's class
 */
router.get("/swap-candidates", async (req, res) => {
  try {
    const { absent_staff_id, start_time, end_time } = req.query;

    if (!absent_staff_id || !start_time || !end_time) {
      return res.status(400).json({
        error: "absent_staff_id, start_time, and end_time are required",
      });
    }

    const query = `
      SELECT
        s.id,
        s.name,
        ROUND(
          EXTRACT(EPOCH FROM (
            $2::time - COALESCE(
              (SELECT MAX(t2.end_time)
               FROM timetable t2
               WHERE t2.staff_id = s.id
                 AND t2.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
                 AND t2.end_time <= $2::time),
              '09:00:00'::time
            )
          )) / 60
        ) AS free_minutes
      FROM staff s
      WHERE s.department_id = (
          SELECT department_id
          FROM staff
          WHERE id = $1
      )
      -- Exclude staff marked absent today (they appear as absent_staff_id in alter_requests)
      AND s.id NOT IN (
          SELECT DISTINCT ar.absent_staff_id
          FROM alter_requests ar
          WHERE ar.class_date = CURRENT_DATE
      )
      AND NOT EXISTS (
          SELECT 1
          FROM timetable t
          WHERE t.staff_id = s.id
            AND t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
            AND t.start_time < $3::time
            AND t.end_time > $2::time
      )
      AND s.id != $1
      AND s.is_active = true
      ORDER BY free_minutes DESC
    `;

    const result = await pool.query(query, [absent_staff_id, start_time, end_time]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching swap candidates:", error);
    res.status(500).json({ error: "Failed to fetch swap candidates" });
  }
});

/**
 * POST /api/hod/assign-swap
 * Creates (or updates) an alter_request – assigns a swap candidate to an affected class
 */
router.post("/assign-swap", async (req, res) => {
  try {
    const { alter_request_id, recommended_staff_id } = req.body;

    if (!alter_request_id || !recommended_staff_id) {
      return res.status(400).json({ error: "alter_request_id and recommended_staff_id are required" });
    }

    const query = `
      UPDATE alter_requests
      SET
        recommended_staff_id = $2,
        status = 'APPROVED',
        approved_by = $3,
        expires_at = NOW() + INTERVAL '1 hour'
      WHERE id = $1
        AND department_id = $4
      RETURNING
        id AS alter_request_id,
        class_name,
        subject,
        start_time,
        end_time,
        absent_staff_id,
        recommended_staff_id,
        status
    `;

    const result = await pool.query(query, [
      alter_request_id,
      recommended_staff_id,
      req.user.id,
      req.user.department_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alter request not found" });
    }

    // Attach staff names
    const row = result.rows[0];
    const [staffRes, absentRes] = await Promise.all([
      pool.query(`SELECT name FROM staff WHERE id = $1`, [recommended_staff_id]),
      pool.query(`SELECT name FROM staff WHERE id = $1`, [row.absent_staff_id]),
    ]);

    res.json({
      ...row,
      assigned_staff_name: staffRes.rows[0]?.name || "Unknown",
      absent_teacher: absentRes.rows[0]?.name || "Unknown",
    });
  } catch (error) {
    console.error("Error assigning swap:", error);
    res.status(500).json({ error: "Failed to assign swap", detail: error.message });
  }
});

export default router;
