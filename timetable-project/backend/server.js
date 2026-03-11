const express = require("express");
const cors = require("cors");
const pool = require("./db");
const app = express();

app.use(cors());
app.use(express.json());


// Get departments
app.get("/departments", async (req, res) => {

  const result = await pool.query(
    "SELECT id, name FROM departments ORDER BY name"
  );

  res.json(result.rows);

});


// Get classes in department
app.get("/classes/:deptId", async (req, res) => {

  const { deptId } = req.params;

  const result = await pool.query(
    "SELECT DISTINCT class_name FROM timetable WHERE department_id=$1",
    [deptId]
  );

  res.json(result.rows);

});


// Get timetable for class
app.get("/timetable/:className", async (req, res) => {

  const { className } = req.params;

  const result = await pool.query(
    `
    SELECT
      day_of_week,
      start_time,
      end_time,
      subject
    FROM timetable
    WHERE class_name=$1
    ORDER BY day_of_week,start_time
    `,
    [className]
  );

  res.json(result.rows);

});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});