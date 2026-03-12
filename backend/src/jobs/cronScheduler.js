/**
 * Cron Scheduler
 * Runs staffStatus refresh and alterRequest generation every 1 minute.
 */

import cron from 'node-cron';
import { refreshStaffStatus } from '../services/staffStatusService.js';
import { generateAlterRequests, cleanupStaleAlterRequests } from '../services/alterRequestService.js';

let isRunning = false;

async function tick() {
  if (isRunning) {
    console.log('⏳ [cron] Previous tick still running – skipping');
    return;
  }

  isRunning = true;
  const start = Date.now();

  try {
    // 1. Refresh staff_status table
    const statusCount = await refreshStaffStatus();
    console.log(`✅ [cron] staff_status refreshed (${statusCount} rows)`);

    // 2. Clean up stale alter_requests (staff who were marked absent but are actually present)
    const cleaned = await cleanupStaleAlterRequests();
    if (cleaned > 0) {
      console.log(`🧹 [cron] ${cleaned} stale alter_request(s) removed (staff actually present)`);
    }

    // 3. Generate any new alter_requests for today
    const inserted = await generateAlterRequests();
    if (inserted > 0) {
      console.log(`✅ [cron] ${inserted} new alter_request(s) created`);
    }
  } catch (err) {
    console.error('❌ [cron] tick error:', err.message);
  } finally {
    isRunning = false;
    console.log(`🕐 [cron] tick done in ${Date.now() - start}ms`);
  }
}

/**
 * Start the cron job – runs every 1 minute.
 * Also fires once immediately so the tables are up-to-date on server start.
 */
export function startCronJobs() {
  // Run once immediately
  tick();

  // Then every minute
  cron.schedule('* * * * *', tick);
  console.log('🔄 [cron] Scheduled staffStatus + alterRequests every 1 min');
}

export default { startCronJobs };
