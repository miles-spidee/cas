import express from "express";
import cors from "cors";
import { pool } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import hodRoutes from "./routes/hod.routes.js";
import { requireAuth, requireHOD } from "./middlewares/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "OK" });
});

// Public auth routes (login, /me)
app.use("/api/auth", authRoutes);

// Protected HOD routes — require valid JWT + HOD role
app.use("/api/hod", requireAuth, requireHOD, hodRoutes);

// Test database connection
app.get("/api/db-test", async (_, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ 
      status: "OK", 
      message: "Database connected successfully",
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ 
      status: "ERROR", 
      message: "Database connection failed",
      error: error.message || String(error),
      code: error.code,
      hint: "Make sure PostgreSQL is running and the DATABASE_URL in .env is correct"
    });
  }
});

export default app;
