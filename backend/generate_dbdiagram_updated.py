"""
Updated DBDiagram.io code including the new Credentials table
"""

dbdiagram_code = """
Table departments {
  id int [pk, increment]
  name varchar(100) [not null]
  code varchar(20) [unique, not null]
}

Table faculties {
  id int [pk, increment]
  name varchar(100) [not null]
  email varchar(100) [unique, not null]
  password varchar(255)
  phone varchar(20)
  department_id int [ref: > departments.id]
  image varchar(255)
  linkedin varchar(255)
  github varchar(255)
  experience varchar(50)
  c_exp varchar(50)
  py_exp varchar(50)
  research varchar(255)
  personal_email varchar(100)
  classes text
}

Table admins {
  id int [pk, increment]
  username varchar(100) [unique, not null]
  password varchar(255) [not null]
}

Table credentials {
  id int [pk, increment]
  email varchar(255) [unique, not null]
  password varchar(255) [not null]
  user_type varchar(50) [not null]
  user_id int
  is_active boolean [default: true]
  created_at datetime [default: CURRENT_TIMESTAMP]
  updated_at datetime [default: CURRENT_TIMESTAMP]
  last_login datetime
  login_attempts int [default: 0]
  is_locked boolean [default: false]
  note: "Centralized authentication table for email/password login"
}

Table period_timings {
  id int [pk, increment]
  period int [unique, not null]
  start_time varchar(20) [not null]
  end_time varchar(20) [not null]
  display_time varchar(50)
}

Table timetable_entries {
  id int [pk, increment]
  day varchar(20) [not null]
  period int [not null]
  subject varchar(100)
  class_type varchar(20)
  faculty_id int [ref: > faculties.id]
  department_id int [ref: > departments.id]
}

Table syllabus {
  id int [pk, increment]
  session_number int [not null]
  session_title varchar(200) [not null]
  unit int [not null]
  topics text
  ppt_url varchar(255)
}

Table lab_programs {
  id int [pk, increment]
  program_number int [not null]
  program_title varchar(200) [not null]
  description text
  moodle_url varchar(255)
}

Table video_uploads {
  id int [pk, increment]
  faculty_id int [ref: > faculties.id, not null]
  filename varchar(255) [not null]
  file_size int
  duration_seconds int
  upload_date datetime [default: CURRENT_TIMESTAMP]
}
"""

def main():
    print("\n" + "="*100)
    print("UPDATED DBDIAGRAM.IO CODE - Database Schema with Credentials Table")
    print("="*100)
    print("\n📊 Copy the code below and paste it into https://dbdiagram.io/\n")
    print(dbdiagram_code)
    print("\n" + "="*100)
    print("WHAT'S NEW:")
    print("="*100)
    print("""
✨ NEW TABLE: Credentials
  - Centralized authentication table for email/password login
  - Stores hashed passwords (bcrypt)
  - Tracks login attempts and account status
  - Supports both 'admin' and 'faculty' user types
  - Includes audit trail (created_at, updated_at, last_login)
  - Account locking capability for security

CURRENT DATA IN CREDENTIALS TABLE:
  - 1 Admin account (mail-admin@gmail.com)
  - 14 Faculty accounts (using their email addresses)
  - Total: 15 credentials

SCHEMA IMPROVEMENTS:
  - Centralized authentication management
  - Better security with bcrypt hashing
  - Account status tracking
  - Failed login attempt monitoring
  - Audit trail for compliance
    """)
    print("="*100 + "\n")

if __name__ == "__main__":
    main()
