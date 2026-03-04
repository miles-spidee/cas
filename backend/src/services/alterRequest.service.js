/**
 * Alter Request Service
 * Processes absent staff and creates alter requests for their scheduled classes
 */

import { pool } from '../config/db.js';

/**
 * Process absent staff and create alter requests for their classes
 * @param {Date} date - The date to check (defaults to today)
 * @returns {Object} - Result with created alter requests
 */
export async function processAbsentStaffAndCreateAlterRequests(date = new Date()) {
  const targetDate = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7, keep Mon-Sat as 1-6
  
  console.log(`\n🔍 Processing absent staff for date: ${targetDate} (Day: ${dayOfWeek})`);
  console.log('═'.repeat(70));

  try {
    // Step 1: Find all absent staff for the given date
    const absentStaffQuery = `
      SELECT 
        a.staff_id,
        s.name as staff_name,
        s.department_id
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.date = $1 
        AND a.status = 'ABSENT'
    `;
    
    const absentStaffResult = await pool.query(absentStaffQuery, [targetDate]);
    const absentStaff = absentStaffResult.rows;
    
    console.log(`\n📋 Found ${absentStaff.length} absent staff member(s)`);
    
    if (absentStaff.length === 0) {
      console.log('✅ No absent staff found. No alter requests needed.');
      return { success: true, alterRequestsCreated: 0, details: [] };
    }

    // Log absent staff
    absentStaff.forEach((staff, i) => {
      console.log(`   ${i + 1}. ${staff.staff_name}`);
    });

    // Step 2: For each absent staff, find their scheduled classes for today
    const classesQuery = `
      SELECT 
        t.id as timetable_id,
        t.staff_id,
        t.class_name,
        t.subject,
        t.day,
        t.period,
        s.name as staff_name,
        s.department_id
      FROM timetable t
      JOIN staff s ON t.staff_id = s.id
      WHERE t.staff_id = ANY($1)
        AND t.day = $2
      ORDER BY t.period
    `;
    
    const staffIds = absentStaff.map(s => s.staff_id);
    
    // Debug: First check what columns exist in timetable
    console.log(`\n   Checking timetable for staff IDs: ${staffIds.join(', ')}`);
    console.log(`   Day of week: ${dayOfWeek}`);
    
    const classesResult = await pool.query(classesQuery, [staffIds, dayOfWeek]);
    const scheduledClasses = classesResult.rows;
    
    console.log(`\n📚 Found ${scheduledClasses.length} scheduled class(es) for absent staff`);
    
    if (scheduledClasses.length === 0) {
      console.log('✅ No classes scheduled for absent staff today. No alter requests needed.');
      return { success: true, alterRequestsCreated: 0, details: [] };
    }

    // Log scheduled classes
    scheduledClasses.forEach((cls, i) => {
      console.log(`   ${i + 1}. ${cls.staff_name} - ${cls.class_name} (${cls.subject}) Period: ${cls.period}`);
    });

    // Define period times for mapping
    const periodTimes = {
      1: { start: '09:00:00', end: '09:50:00' },
      2: { start: '09:55:00', end: '10:45:00' },
      3: { start: '10:50:00', end: '11:40:00' },
      4: { start: '11:45:00', end: '12:35:00' },
      5: { start: '13:30:00', end: '14:20:00' },
      6: { start: '14:25:00', end: '15:15:00' },
      7: { start: '15:20:00', end: '16:10:00' },
      8: { start: '16:15:00', end: '17:05:00' }
    };

    // Step 3: For each class, find a recommended substitute staff
    const createdRequests = [];
    
    for (const cls of scheduledClasses) {
      const times = periodTimes[cls.period] || { start: '09:00:00', end: '09:50:00' };
      console.log(`\n🔄 Processing: ${cls.class_name} - ${cls.subject} (Period ${cls.period})`);
      
      // Find available staff who:
      // 1. Are in the same department
      // 2. Are not absent today
      // 3. Don't have a class at the same period
      const findSubstituteQuery = `
        SELECT s.id, s.name
        FROM staff s
        WHERE s.department_id = $1
          AND s.id != $2
          AND s.is_active = true
          AND s.id NOT IN (
            -- Exclude staff who are absent today
            SELECT staff_id FROM attendance 
            WHERE date = $3 AND status = 'ABSENT'
          )
          AND s.id NOT IN (
            -- Exclude staff who have class at the same period
            SELECT t.staff_id FROM timetable t
            WHERE t.day = $4 AND t.period = $5
          )
        ORDER BY random()
        LIMIT 1
      `;
      
      const substituteResult = await pool.query(findSubstituteQuery, [
        cls.department_id,
        cls.staff_id,
        targetDate,
        dayOfWeek,
        cls.period
      ]);
      
      if (substituteResult.rows.length === 0) {
        console.log(`   ⚠️ No available substitute found for this class`);
        continue;
      }
      
      const substitute = substituteResult.rows[0];
      console.log(`   ✓ Recommended substitute: ${substitute.name}`);
      
      // Step 4: Create the alter request
      // Note: class_name column has incorrect type (time with time zone) in DB
      // Using start_time as class_name workaround
      const createAlterRequestQuery = `
        INSERT INTO alter_requests (
          absent_staff_id,
          class_name,
          subject,
          class_date,
          start_time,
          end_time,
          department_id,
          recommended_staff_id,
          status,
          created_at,
          expired_at,
          approved_by
        ) VALUES (
          $1, $2::time, $3, $4, $5::time, $6::time, $7, $8, 'PENDING',
          NOW(),
          NOW() + INTERVAL '2 hours',
          NULL
        )
        RETURNING id, absent_staff_id, subject, class_date, start_time, end_time, recommended_staff_id, status
      `;
      
      const createResult = await pool.query(createAlterRequestQuery, [
        cls.staff_id,
        times.start,  // Using start_time as class_name due to schema issue
        cls.subject,
        targetDate,
        times.start,
        times.end,
        cls.department_id,
        substitute.id
      ]);
      
      const createdRequest = createResult.rows[0];
      createdRequests.push({
        ...createdRequest,
        class_name: cls.class_name,  // Store actual class name in result
        absent_staff_name: cls.staff_name,
        recommended_staff_name: substitute.name
      });
      
      console.log(`   ✅ Alter request created (ID: ${createdRequest.id})`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`\n✨ Summary: Created ${createdRequests.length} alter request(s)`);
    
    return {
      success: true,
      alterRequestsCreated: createdRequests.length,
      details: createdRequests
    };

  } catch (error) {
    console.error('❌ Error processing absent staff:', error.message);
    throw error;
  }
}

/**
 * Get all pending alter requests
 * @returns {Array} - List of pending alter requests
 */
export async function getPendingAlterRequests() {
  const query = `
    SELECT 
      ar.id,
      ar.class_name,
      ar.subject,
      ar.class_date,
      ar.start_time,
      ar.end_time,
      ar.status,
      ar.created_at,
      ar.expired_at,
      absent_staff.name as absent_staff_name,
      recommended_staff.name as recommended_staff_name,
      d.name as department_name
    FROM alter_requests ar
    JOIN staff absent_staff ON ar.absent_staff_id = absent_staff.id
    JOIN staff recommended_staff ON ar.recommended_staff_id = recommended_staff.id
    JOIN departments d ON ar.department_id = d.id
    WHERE ar.status = 'PENDING'
    ORDER BY ar.class_date, ar.start_time
  `;
  
  const result = await pool.query(query);
  return result.rows;
}

export default {
  processAbsentStaffAndCreateAlterRequests,
  getPendingAlterRequests
};
