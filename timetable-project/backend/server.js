const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* -------------------------
   TEST API
------------------------- */

app.get("/", (req, res) => {
  res.send("Timetable API Running");
});

/* -------------------------
   GET DEPARTMENTS
------------------------- */

app.get("/departments", async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT id, name FROM departments ORDER BY name"
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   GET CLASSES BY DEPARTMENT
------------------------- */

app.get("/classes/:deptId", async (req, res) => {

  const { deptId } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT DISTINCT class_name
      FROM timetable
      WHERE department_id = $1
      `,
      [deptId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   CREATE CLASS (placeholder entry)
------------------------- */

app.post("/classes", async (req, res) => {

  const { class_name, department_id } = req.body;

  if (!class_name || !department_id) {
    return res.status(400).json({ error: "class_name and department_id are required" });
  }

  try {

    // Check if class already exists in this department
    const existing = await pool.query(
      "SELECT DISTINCT class_name FROM timetable WHERE class_name = $1 AND department_id = $2",
      [class_name, department_id]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Class already exists in this department" });
    }

    // Insert a placeholder row so the class shows up in the class list
    const result = await pool.query(
      `
      INSERT INTO timetable (class_name, department_id, day_of_week, start_time, end_time, subject, staff_id)
      VALUES ($1, $2, 1, '08:00:00', '08:45:00', 'TBD', NULL)
      RETURNING *
      `,
      [class_name, department_id]
    );

    res.status(201).json({ message: "Class created", class_name, entry: result.rows[0] });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   GET TIMETABLE
------------------------- */

app.get("/timetable/:className", async (req, res) => {

  const { className } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.day_of_week,
        t.start_time,
        t.end_time,
        t.subject,
        t.staff_id,
        t.department_id,
        s.name AS staff_name
      FROM timetable t
      LEFT JOIN staff s
      ON t.staff_id = s.id
      WHERE t.class_name = $1
      ORDER BY t.day_of_week, t.start_time
      `,
      [className]
    );

    const rows = result.rows;

    const timetable = {};

    const timeToPeriod = {
      "08:00:00": 1,
      "08:45:00": 2,
      "09:45:00": 3,
      "10:30:00": 4,
      "11:15:00": 5,
      "13:00:00": 6,
      "13:45:00": 7,
      "14:30:00": 8
    };

    rows.forEach(row => {

      const day = row.day_of_week;
      const start = row.start_time;
      const end = row.end_time;

      const startPeriod = timeToPeriod[start];

      if (!startPeriod) return;

      const duration = (
        new Date(`1970-01-01T${end}`) -
        new Date(`1970-01-01T${start}`)
      ) / (45 * 60 * 1000);

      if (!timetable[day]) timetable[day] = {};

      timetable[day][startPeriod] = {
        id: row.id,
        subject: row.subject,
        staff: row.staff_name,
        staff_id: row.staff_id,
        department_id: row.department_id,
        start_time: row.start_time,
        end_time: row.end_time,
        span: duration
      };

    });

    res.json(timetable);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   CREATE TIMETABLE ENTRY
------------------------- */

app.post("/timetable", async (req, res) => {

  const { class_name, day_of_week, start_time, end_time, subject, staff_id, department_id } = req.body;

  try {

    const result = await pool.query(
      `
      INSERT INTO timetable (class_name, day_of_week, start_time, end_time, subject, staff_id, department_id)
      VALUES ($1, $2, $3, $4, $5, $6::uuid, $7)
      RETURNING *
      `,
      [class_name, day_of_week, start_time, end_time, subject, staff_id, department_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   UPDATE TIMETABLE ENTRY
------------------------- */

app.put("/timetable/:id", async (req, res) => {

  const { id } = req.params;
  const { day_of_week, start_time, end_time, subject, staff_id } = req.body;

  try {

    const result = await pool.query(
      `
      UPDATE timetable
      SET day_of_week = $1,
          start_time  = $2,
          end_time    = $3,
          subject     = $4,
          staff_id    = $5::uuid
      WHERE id = $6::uuid
      RETURNING *
      `,
      [day_of_week, start_time, end_time, subject, staff_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   DELETE TIMETABLE ENTRY
------------------------- */

app.delete("/timetable/:id", async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      "DELETE FROM timetable WHERE id = $1::uuid RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Deleted successfully", deleted: result.rows[0] });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   GET STAFF LIST
------------------------- */

app.get("/staff", async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT id, name, department_id FROM staff ORDER BY name"
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

app.get("/staff/:deptId", async (req, res) => {

  const { deptId } = req.params;

  try {

    const result = await pool.query(
      "SELECT id, name, department_id FROM staff WHERE department_id = $1 ORDER BY name",
      [deptId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   GET DISTINCT SUBJECTS
------------------------- */

app.get("/subjects", async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT DISTINCT subject FROM timetable ORDER BY subject"
    );

    res.json(result.rows.map(r => r.subject));

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   START SERVER
------------------------- */

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});