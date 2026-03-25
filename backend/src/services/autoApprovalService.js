/**
 * Auto-Approval Service
 * Automatically approves PENDING alter_requests when the class start time
 * is within 40 minutes (i.e., start_time - 40 minutes <= NOW).
 *
 * Logic:
 * - If a class starts at 09:00 AM, auto-approve when NOW >= 08:20 AM
 * - This gives 40 minutes notice before the class starts
 * - Sets status to AUTO_APPROVED and leaves approved_by as NULL to indicate auto-approval
 */

import { pool } from '../config/db.js';

/**
 * Find all PENDING alter_requests where:
 * - Class date is TODAY
 * - Start time - 40 minutes <= NOW (class is within 40 minutes from now)
 * - Has a recommended_staff_id (already assigned)
 *
 * Auto-approve them by setting status = 'AUTO_APPROVED' and approved_by = NULL.
 *
 * @returns {number} Number of alter_requests auto-approved
 */
export async function autoApproveAlterRequests() {
  const query = `
    UPDATE alter_requests
    SET
      status = 'AUTO_APPROVED',
      approved_by = NULL,
      expires_at = NOW() + INTERVAL '1 hour'
    WHERE class_date = CURRENT_DATE
      AND status = 'PENDING'
      AND recommended_staff_id IS NOT NULL
      -- Convert start_time (time) to timestamp for comparison with NOW
      -- If start_time is 09:00, this becomes '2026-03-13 08:20:00 IST'
      AND (CURRENT_DATE + start_time AT TIME ZONE 'Asia/Kolkata')
          <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata' + INTERVAL '40 minutes')
    RETURNING id, absent_staff_id, class_name, start_time
  `;

  const result = await pool.query(query);
  
  if (result.rowCount > 0) {
    console.log(`✅ Auto-approved ${result.rowCount} alter_request(s):`);
    result.rows.forEach(row => {
      console.log(`   - ${row.class_name} at ${row.start_time}`);
    });
  }
  
  return result.rowCount;
}

export default { autoApproveAlterRequests };
