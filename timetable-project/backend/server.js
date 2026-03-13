const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const pool = require("./db");

const app = express();
const API_BASE_PATH = "/timemaster";

app.use(cors());
app.use(express.json());

const SLOT_BY_START_TIME = {
  "08:00:00": "P1",
  "08:45:00": "P2",
  "09:30:00": "BREAK",
  "09:45:00": "P3",
  "10:30:00": "P4",
  "11:15:00": "P5",
  "12:00:00": "LUNCH",
  "13:00:00": "P6",
  "13:45:00": "P7",
  "14:30:00": "P8"
};

const PERIOD_SLOT_ORDER = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

const toNullableUuid = (value) => (value ? value : null);
const BREAK_LUNCH_SUBJECTS = new Set(["BREAK", "LUNCH"]);

const normalizeSubject = (subject) => String(subject || "").trim().toUpperCase();
const isBreakOrLunch = (subject) => BREAK_LUNCH_SUBJECTS.has(normalizeSubject(subject));

const generateRfidUid = () => `RFID-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

const ensureUniqueRfidUid = async (dbClient) => {
  for (let i = 0; i < 5; i++) {
    const candidate = generateRfidUid();
    const exists = await dbClient.query(
      "SELECT 1 FROM staff WHERE rfid_uid = $1 LIMIT 1",
      [candidate]
    );
    if (exists.rowCount === 0) {
      return candidate;
    }
  }

  throw new Error("Failed to generate unique RFID UID");
};

const getBreakLunchFallbackStaffId = async (dbClient, departmentId) => {
  const fallbackRfid = `SYSTEM-TIMETABLE-${departmentId}`;

  const existing = await dbClient.query(
    "SELECT id FROM staff WHERE rfid_uid = $1 LIMIT 1",
    [fallbackRfid]
  );

  if (existing.rowCount > 0) {
    return existing.rows[0].id;
  }

  const created = await dbClient.query(
    `
    INSERT INTO staff (name, email, rfid_uid, department_id, role, is_active)
    VALUES ($1, $2, $3, $4, $5::staff_role_enum, $6)
    RETURNING id
    `,
    ["[SYSTEM] TIMETABLE", null, fallbackRfid, departmentId, "STAFF", false]
  );

  return created.rows[0].id;
};

const resolveStaffIdForEntry = async (dbClient, { staff_id, subject, department_id }) => {
  if (staff_id) {
    return staff_id;
  }

  if (isBreakOrLunch(subject)) {
    if (!department_id) {
      throw new Error("department_id is required for BREAK/LUNCH entries");
    }
    return getBreakLunchFallbackStaffId(dbClient, department_id);
  }

  throw new Error("staff_id is required for non-break timetable entries");
};

/* -------------------------
   TEST API
------------------------- */

app.get("/", (req, res) => {
  res.send("Timetable API Running. Use /timemaster as base path.");
});

app.get(`${API_BASE_PATH}`, (req, res) => {
  res.send("Timetable API Running");
});

/* -------------------------
   GET DEPARTMENTS
------------------------- */

app.get(`${API_BASE_PATH}/departments`, async (req, res) => {

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

app.get(`${API_BASE_PATH}/classes/:deptId`, async (req, res) => {

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

app.post(`${API_BASE_PATH}/classes`, async (req, res) => {

  const {
    class_name,
    department_id,
    day_of_week,
    start_time,
    end_time,
    subject,
    staff_id
  } = req.body;

  if (!class_name || !department_id) {
    return res.status(400).json({ error: "class_name and department_id are required" });
  }

  if (!day_of_week || !start_time || !end_time || !subject || !staff_id) {
    return res.status(400).json({
      error: "day_of_week, start_time, end_time, subject and staff_id are required for class creation"
    });
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

    const result = await pool.query(
      `
      INSERT INTO timetable (class_name, department_id, day_of_week, start_time, end_time, subject, staff_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7::uuid)
      RETURNING *
      `,
      [
        class_name,
        department_id,
        day_of_week,
        start_time,
        end_time,
        subject,
        toNullableUuid(staff_id)
      ]
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

app.get(`${API_BASE_PATH}/timetable/:className`, async (req, res) => {

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

    rows.forEach(row => {

      const day = row.day_of_week;
      const start = row.start_time;
      const end = row.end_time;

      const slotKey = SLOT_BY_START_TIME[start];

      if (!slotKey) return;

      const isBreakOrLunch = slotKey === "BREAK" || slotKey === "LUNCH";

      let span = 1;
      if (!isBreakOrLunch) {
        const durationInPeriods = (
          new Date(`1970-01-01T${end}`) -
          new Date(`1970-01-01T${start}`)
        ) / (45 * 60 * 1000);
        span = Math.max(1, Math.round(durationInPeriods));
      }

      if (!isBreakOrLunch) {
        const startIndex = PERIOD_SLOT_ORDER.indexOf(slotKey);
        const maxSpan = PERIOD_SLOT_ORDER.length - startIndex;
        span = Math.min(span, maxSpan);
      }

      if (!timetable[day]) timetable[day] = {};

      timetable[day][slotKey] = {
        id: row.id,
        subject: row.subject,
        staff: isBreakOrLunch ? "" : (row.staff_name || ""),
        staff_id: row.staff_id,
        department_id: row.department_id,
        start_time: row.start_time,
        end_time: row.end_time,
        span
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

app.post(`${API_BASE_PATH}/timetable`, async (req, res) => {

  const { class_name, day_of_week, start_time, end_time, subject, staff_id, department_id } = req.body;

  if (!class_name || !day_of_week || !start_time || !end_time || !subject || !department_id) {
    return res.status(400).json({ error: "Missing required timetable fields" });
  }

  try {

    const resolvedStaffId = await resolveStaffIdForEntry(pool, {
      staff_id: toNullableUuid(staff_id),
      subject,
      department_id
    });

    const result = await pool.query(
      `
      INSERT INTO timetable (class_name, day_of_week, start_time, end_time, subject, staff_id, department_id)
      VALUES ($1, $2, $3, $4, $5, $6::uuid, $7)
      RETURNING *
      `,
      [class_name, day_of_week, start_time, end_time, subject, resolvedStaffId, department_id]
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

app.put(`${API_BASE_PATH}/timetable/:id`, async (req, res) => {

  const { id } = req.params;
  const { day_of_week, start_time, end_time, subject, staff_id, department_id } = req.body;

  try {

    const currentRow = await pool.query(
      "SELECT department_id FROM timetable WHERE id = $1::uuid LIMIT 1",
      [id]
    );

    if (currentRow.rowCount === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const resolvedDepartmentId = department_id || currentRow.rows[0].department_id;
    const resolvedStaffId = await resolveStaffIdForEntry(pool, {
      staff_id: toNullableUuid(staff_id),
      subject,
      department_id: resolvedDepartmentId
    });

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
        [day_of_week, start_time, end_time, subject, resolvedStaffId, id]
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

app.delete(`${API_BASE_PATH}/timetable/:id`, async (req, res) => {

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
   BATCH UPSERT TIMETABLE
------------------------- */

app.post(`${API_BASE_PATH}/timetable/batch`, async (req, res) => {

  const {
    creates = [],
    updates = [],
    deletes = []
  } = req.body || {};

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const createdRows = [];
    const updatedRows = [];
    const deletedRows = [];

    for (const item of creates) {
      const { class_name, day_of_week, start_time, end_time, subject, staff_id, department_id } = item;

      const resolvedStaffId = await resolveStaffIdForEntry(client, {
        staff_id: toNullableUuid(staff_id),
        subject,
        department_id
      });

      const insertResult = await client.query(
        `
        INSERT INTO timetable (class_name, day_of_week, start_time, end_time, subject, staff_id, department_id)
        VALUES ($1, $2, $3, $4, $5, $6::uuid, $7)
        RETURNING *
        `,
        [class_name, day_of_week, start_time, end_time, subject, resolvedStaffId, department_id]
      );

      createdRows.push(insertResult.rows[0]);
    }

    for (const item of updates) {
      const { id, day_of_week, start_time, end_time, subject, staff_id, department_id } = item;

      const currentRow = await client.query(
        "SELECT department_id FROM timetable WHERE id = $1::uuid LIMIT 1",
        [id]
      );

      if (currentRow.rowCount === 0) {
        continue;
      }

      const resolvedDepartmentId = department_id || currentRow.rows[0].department_id;
      const resolvedStaffId = await resolveStaffIdForEntry(client, {
        staff_id: toNullableUuid(staff_id),
        subject,
        department_id: resolvedDepartmentId
      });

      const updateResult = await client.query(
        `
        UPDATE timetable
        SET day_of_week = $1,
            start_time = $2,
            end_time = $3,
            subject = $4,
            staff_id = $5::uuid
        WHERE id = $6::uuid
        RETURNING *
        `,
        [day_of_week, start_time, end_time, subject, resolvedStaffId, id]
      );

      if (updateResult.rowCount > 0) {
        updatedRows.push(updateResult.rows[0]);
      }
    }

    for (const id of deletes) {
      const deleteResult = await client.query(
        "DELETE FROM timetable WHERE id = $1::uuid RETURNING *",
        [id]
      );

      if (deleteResult.rowCount > 0) {
        deletedRows.push(deleteResult.rows[0]);
      }
    }

    await client.query("COMMIT");

    res.json({
      message: "Batch save completed",
      creates: createdRows,
      updates: updatedRows,
      deletes: deletedRows
    });

  } catch (err) {

    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });

  } finally {

    client.release();

  }

});

/* -------------------------
   GET STAFF LIST
------------------------- */

app.get(`${API_BASE_PATH}/staff`, async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT id, name, email, department_id FROM staff WHERE is_active = true ORDER BY name"
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

app.get(`${API_BASE_PATH}/staff/:deptId`, async (req, res) => {

  const { deptId } = req.params;

  try {

    const result = await pool.query(
      "SELECT id, name, email, department_id FROM staff WHERE department_id = $1 AND is_active = true ORDER BY name",
      [deptId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

app.post(`${API_BASE_PATH}/staff`, async (req, res) => {

  const { name, email, department_id, role = "STAFF", rfid_uid } = req.body;

  if (!name || !department_id) {
    return res.status(400).json({ error: "name and department_id are required" });
  }

  try {

    const finalRfid = rfid_uid || await ensureUniqueRfidUid(pool);

    const result = await pool.query(
      `
      INSERT INTO staff (name, email, rfid_uid, department_id, role, is_active)
      VALUES ($1, $2, $3, $4, $5::staff_role_enum, $6)
      RETURNING id, name, email, department_id, role, rfid_uid, is_active
      `,
      [name.trim(), email ? email.trim() : null, finalRfid, department_id, role, true]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

app.put(`${API_BASE_PATH}/staff/:id`, async (req, res) => {

  const { id } = req.params;
  const { name, email, department_id, role } = req.body;

  if (!name || !department_id) {
    return res.status(400).json({ error: "name and department_id are required" });
  }

  try {

    let result;

    if (role) {
      result = await pool.query(
        `
        UPDATE staff
        SET name = $1,
            email = $2,
            department_id = $3,
            role = $4::staff_role_enum
        WHERE id = $5::uuid
        RETURNING id, name, email, department_id, role, rfid_uid, is_active
        `,
        [name.trim(), email ? email.trim() : null, department_id, role, id]
      );
    } else {
      result = await pool.query(
        `
        UPDATE staff
        SET name = $1,
            email = $2,
            department_id = $3
        WHERE id = $4::uuid
        RETURNING id, name, email, department_id, role, rfid_uid, is_active
        `,
        [name.trim(), email ? email.trim() : null, department_id, id]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

app.delete(`${API_BASE_PATH}/staff/:id`, async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      "DELETE FROM staff WHERE id = $1::uuid RETURNING id, name, email, department_id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    res.json({ message: "Staff deleted", deleted: result.rows[0] });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

/* -------------------------
   GET DISTINCT SUBJECTS
------------------------- */

app.get(`${API_BASE_PATH}/subjects`, async (req, res) => {

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});