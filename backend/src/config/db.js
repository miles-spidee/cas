import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. The app will start but DB queries will fail.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Log unexpected errors on the pool so they don't crash silently
pool.on && pool.on("error", (err) => {
  console.error("Postgres pool error:", err && err.message ? err.message : err);
});

// Helper: try to run a simple query with retries (used at startup)
export async function checkConnection({ retries = 5, delayMs = 1000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      return true;
    } catch (err) {
      // EAI_AGAIN or network errors may be transient — retry with backoff
      const isLast = attempt === retries;
      console.warn(`DB connection attempt ${attempt} failed: ${err && err.message}. ${isLast ? 'Giving up.' : `Retrying in ${delayMs}ms...`}`);
      if (isLast) break;
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs = Math.min(delayMs * 2, 10000);
    }
  }
  return false;
}
