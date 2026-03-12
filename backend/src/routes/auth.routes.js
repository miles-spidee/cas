import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { JWT_SECRET } from "../middlewares/auth.js";

const router = Router();

/**
 * POST /api/auth/login
 * Validates HOD email + password → returns JWT with department info
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Look up the staff member by email
    const staffResult = await pool.query(
      `SELECT s.id, s.name, s.email, s.password_hash, s.role, s.department_id,
              d.name AS department_name
       FROM staff s
       JOIN departments d ON d.id = s.department_id
       WHERE s.email = $1`,
      [email.trim().toLowerCase()]
    );

    if (staffResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const staff = staffResult.rows[0];

    // Must be an HOD
    if (staff.role !== "HOD") {
      return res.status(403).json({ error: "Only HODs can log in to this portal" });
    }

    // Check password
    if (!staff.password_hash) {
      return res.status(401).json({
        error: "Password not set. Contact admin to set your password.",
      });
    }

    const passwordValid = await bcrypt.compare(password, staff.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT (expires in 12 hours)
    const payload = {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      department_id: staff.department_id,
      department_name: staff.department_name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });

    res.json({
      token,
      user: payload,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed", detail: error.message });
  }
});

/**
 * GET /api/auth/me
 * Returns the current user info from a valid JWT (for session restore)
 */
router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
