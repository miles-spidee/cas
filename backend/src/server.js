import "dotenv/config";
import app from "./app.js";
import { pool, checkConnection } from "./config/db.js";
import { startCronJobs } from "./jobs/cronScheduler.js";

const PORT = process.env.PORT || 5000;

// Test database connection on startup with retries.
// If DB cannot be reached we still start the server but log clear guidance.
const testDbConnection = async () => {
  console.log("Testing database connection...");
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  const ok = await checkConnection({ retries: 5, delayMs: 1000 });
  if (ok) {
    try {
      const result = await pool.query("SELECT NOW()");
      console.log("✅ Database connected successfully at:", result.rows[0].now);
    } catch (err) {
      console.warn("Database reachable but SELECT NOW() failed:", err.message || err);
    }
  } else {
    console.error("❌ Database connection failed after retries.");
    console.error("Reason: host resolution/network issue (EAI_AGAIN) or remote DB is unreachable.");
    console.error("Possible fixes:");
    console.error("  - Check your internet connection and DNS (try 'ping aws-1-ap-northeast-1.pooler.supabase.com')");
    console.error("  - If working offline, point DATABASE_URL to a local Postgres instance in backend/.env");
    console.error("  - Ensure DATABASE_URL is correct and the database allows connections from your IP");
  }
  return ok;
};

app.listen(PORT, async () => {
  console.log(`Backend running on port ${PORT}`);
  const dbOk = await testDbConnection();
  if (dbOk) {
    startCronJobs();
  }
});