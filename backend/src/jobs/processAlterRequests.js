/**
 * Run Alter Request Processing
 * This script processes absent staff and creates alter requests
 * Run: node src/jobs/processAlterRequests.js
 */

import 'dotenv/config';
import { processAbsentStaffAndCreateAlterRequests, getPendingAlterRequests } from '../services/alterRequest.service.js';

async function main() {
  console.log('🚀 Starting Alter Request Processing Job');
  console.log('═'.repeat(70));
  console.log(`Date: ${new Date().toISOString()}`);
  
  try {
    // Process absent staff and create alter requests
    const result = await processAbsentStaffAndCreateAlterRequests();
    
    console.log('\n📊 Processing Complete!');
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Alter Requests Created: ${result.alterRequestsCreated}`);
    
    if (result.details.length > 0) {
      console.log('\n📝 Created Alter Requests:');
      console.table(result.details.map(r => ({
        'Class': r.class_name,
        'Subject': r.subject,
        'Date': r.class_date,
        'Time': `${r.start_time} - ${r.end_time}`,
        'Absent Staff': r.absent_staff_name,
        'Recommended': r.recommended_staff_name,
        'Status': r.status
      })));
    }

    // Show all pending alter requests
    console.log('\n' + '═'.repeat(70));
    console.log('📋 All Pending Alter Requests:');
    
    const pendingRequests = await getPendingAlterRequests();
    
    if (pendingRequests.length > 0) {
      console.table(pendingRequests.map(r => ({
        'ID': r.id,
        'Class': r.class_name,
        'Subject': r.subject,
        'Date': r.class_date,
        'Time': `${r.start_time} - ${r.end_time}`,
        'Absent': r.absent_staff_name,
        'Recommended': r.recommended_staff_name,
        'Dept': r.department_name,
        'Status': r.status
      })));
    } else {
      console.log('   No pending alter requests found.');
    }

    console.log('\n✨ Job completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Job failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
