/**
 * Debug Script - Check table schemas
 */

import 'dotenv/config';
import { pool } from '../config/db.js';

async function checkSchemas() {
  try {
    console.log('🔍 Checking table schemas...\n');
    
    // Check timetable columns
    const timetableSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'timetable'
      ORDER BY ordinal_position
    `);
    
    console.log('📅 TIMETABLE columns:');
    console.table(timetableSchema.rows);
    
    // Check alter_requests columns
    const alterRequestsSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'alter_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 ALTER_REQUESTS columns:');
    console.table(alterRequestsSchema.rows);
    
    // Check sample timetable data
    const sampleTimetable = await pool.query(`SELECT * FROM timetable LIMIT 3`);
    console.log('\n📝 Sample TIMETABLE data:');
    console.table(sampleTimetable.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchemas();
