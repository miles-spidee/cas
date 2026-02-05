import "dotenv/config";
import app from "./app.js";
import { pool } from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Test database connection on startup
const testDbConnection = async () => {
  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully at:", result.rows[0].now);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

app.listen(PORT, async () => {
  console.log(`Backend running on port ${PORT}`);
  await testDbConnection();
});