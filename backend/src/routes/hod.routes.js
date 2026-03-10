import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

/**
 * GET /api/hod/absent-staff
 * Returns staff who have NO attendance record for today
 */
router.get("/absent-staff", async (req, res) => {
  try {
    const dept = req.query.department_id;

    let query;
    let params;

    if (dept) {
      query = `
        SELECT s.id, s.name
        FROM staff s
        WHERE s.department_id = $1
          AND NOT EXISTS (
            SELECT 1
            FROM attendance a
            WHERE a.staff_id = s.id
              AND a.date = CURRENT_DATE
          )
        ORDER BY s.name
      `;
      params = [dept];
    } else {
      query = `
        SELECT s.id, s.name
        FROM staff s
        WHERE NOT EXISTS (
          SELECT 1
          FROM attendance a
          WHERE a.staff_id = s.id
            AND a.date = CURRENT_DATE
        )
        ORDER BY s.name
      `;
      params = [];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching absent staff:", error);
    res.status(500).json({ error: "Failed to fetch absent staff" });
  }
});

/**
 * GET /api/hod/affected-classes
 * Returns timetable entries for today whose assigned staff are absent
 */
router.get("/affected-classes", async (req, res) => {
  try {
    const query = `
      SELECT
        t.class_name,
        t.subject,
        t.start_time,
        t.end_time,
        s.id AS absent_staff_id,
        s.name AS absent_teacher
      FROM timetable t
      JOIN staff s ON s.id = t.staff_id
      WHERE t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
        AND NOT EXISTS (
          SELECT 1
          FROM attendance a
          WHERE a.staff_id = t.staff_id
            AND a.date = CURRENT_DATE
        )
      ORDER BY t.start_time
    `;

    const result = await pool.query(query);
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
      -- Exclude staff who are absent today (no attendance record when others have checked in,
      -- OR explicitly not checked in). We use the same logic as absent-staff endpoint.
      AND NOT (
          NOT EXISTS (
            SELECT 1
            FROM attendance a
            WHERE a.staff_id = s.id
              AND a.date = CURRENT_DATE
          )
          AND EXISTS (
            SELECT 1 FROM attendance WHERE date = CURRENT_DATE
          )
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
 * GET /api/hod/assignments
 * Returns today's alter-request assignments so the left panel can show who's assigned
 */
router.get("/assignments", async (req, res) => {
  try {
    const query = `
      SELECT
        ar.id AS assignment_id,
        ar.class_name,
        ar.subject,
        ar.start_time,
        ar.end_time,
        ar.absent_staff_id,
        ar.recommended_staff_id,
        ar.status,
        s.name AS assigned_staff_name
      FROM alter_requests ar
      JOIN staff s ON s.id = ar.recommended_staff_id
      WHERE ar.class_date = CURRENT_DATE
      ORDER BY ar.start_time
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

/**
 * POST /api/hod/assign-swap
 * Creates (or updates) an alter_request – assigns a swap candidate to an affected class
 */
router.post("/assign-swap", async (req, res) => {
  try {
    const {
      absent_staff_id,
      class_name,
      subject,
      start_time,
      end_time,
      recommended_staff_id,
    } = req.body;

    if (
      !absent_staff_id ||
      !class_name ||
      !subject ||
      !start_time ||
      !end_time ||
      !recommended_staff_id
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Get department_id from the absent staff member
    const deptResult = await pool.query(
      `SELECT department_id FROM staff WHERE id = $1`,
      [absent_staff_id]
    );
    if (deptResult.rows.length === 0) {
      return res.status(404).json({ error: "Absent staff not found" });
    }
    const department_id = deptResult.rows[0].department_id;

    // Upsert: if an assignment already exists for this class+slot+date, update it
    const query = `
      INSERT INTO alter_requests (
        absent_staff_id, class_name, subject, class_date,
        start_time, end_time, department_id,
        recommended_staff_id, status, expires_at
      )
      VALUES ($1, $2, $3, CURRENT_DATE, $4::time, $5::time, $6, $7, 'PENDING', NOW() + INTERVAL '1 hour')
      ON CONFLICT (class_name, class_date, start_time)
      DO UPDATE SET
        recommended_staff_id = EXCLUDED.recommended_staff_id,
        status = 'MODIFIED',
        created_at = NOW(),
        expires_at = NOW() + INTERVAL '1 hour'
      RETURNING
        id AS assignment_id,
        class_name,
        subject,
        start_time,
        end_time,
        absent_staff_id,
        recommended_staff_id,
        status
    `;

    const result = await pool.query(query, [
      absent_staff_id,
      class_name,
      subject,
      start_time,
      end_time,
      department_id,
      recommended_staff_id,
    ]);

    // Attach assigned staff name
    const staffResult = await pool.query(
      `SELECT name FROM staff WHERE id = $1`,
      [recommended_staff_id]
    );

    const assignment = {
      ...result.rows[0],
      assigned_staff_name: staffResult.rows[0]?.name || "Unknown",
    };

    res.json(assignment);
  } catch (error) {
    console.error("Error assigning swap:", error);
    res.status(500).json({ error: "Failed to assign swap" });
  }
});

export default router;
