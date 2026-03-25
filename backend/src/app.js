import express from "express";
import cors from "cors";
import { pool } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import hodRoutes from "./routes/hod.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";
import { requireAuth, requireHOD } from "./middlewares/auth.js";

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://kite-cas.vercel.app/",
  process.env.FRONTEND_URL_LOCAL || "http://localhost:5173",
  "http://127.0.0.1:5173",
].map((origin) => origin.replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, Postman, server-side jobs)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "OK" });
});

// Public auth routes (login, /me)
app.use("/api/auth", authRoutes);

// Protected HOD routes — require valid JWT + HOD role
app.use("/api/hod", requireAuth, requireHOD, hodRoutes);

// Protected timetable routes — shared backend module
app.use("/api/timetable", requireAuth, timetableRoutes);

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
