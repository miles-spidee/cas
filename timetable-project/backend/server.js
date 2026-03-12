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
   GET TIMETABLE
------------------------- */

app.get("/timetable/:className", async (req, res) => {

  const { className } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT
        t.day_of_week,
        t.start_time,
        t.end_time,
        t.subject,
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
        subject: row.subject,
        staff: row.staff_name,
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
   START SERVER
------------------------- */

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});