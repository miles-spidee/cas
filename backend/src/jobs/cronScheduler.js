/**
 * Cron Scheduler
 * Runs staffStatus refresh, alterRequest generation, and auto-approval every 1 minute.
 */

import cron from 'node-cron';
import { refreshStaffStatus } from '../services/staffStatusService.js';
import { generateAlterRequests, cleanupStaleAlterRequests } from '../services/alterRequestService.js';
import { autoApproveAlterRequests } from '../services/autoApprovalService.js';

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

    // 3. Generate any new alter_requests for today + auto-assign top candidates
    const { inserted, assigned } = await generateAlterRequests();
    if (inserted > 0) {
      console.log(`✅ [cron] ${inserted} new alter_request(s) created`);
    }
    if (assigned > 0) {
      console.log(`👤 [cron] ${assigned} alter_request(s) auto-assigned to top candidate`);
    }

    // 4. Auto-approve PENDING alter_requests 40 min before start time
    const autoApproved = await autoApproveAlterRequests();
    if (autoApproved > 0) {
      console.log(`✅ [cron] ${autoApproved} alter_request(s) auto-approved (40 min before start)`);
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
