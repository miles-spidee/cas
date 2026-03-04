"""
Generate DBDiagram.io code from SQLAlchemy models
This script creates a DBDiagram definition that can be pasted into https://dbdiagram.io/
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
}
"""

def main():
    print("\n" + "="*100)
    print("DBDIAGRAM.IO CODE - Database Schema Visualization")
    print("="*100)
    print("\n📊 Copy the code below and paste it into https://dbdiagram.io/\n")
    print(dbdiagram_code)
    print("\n" + "="*100)
    print("INSTRUCTIONS:")
    print("="*100)
    print("""
1. Go to https://dbdiagram.io/
2. Click on "New Diagram"
3. Clear the existing content
4. Copy and paste the code above into the editor
5. The diagram will automatically render showing all tables and relationships

KEY FEATURES OF YOUR SCHEMA:
- 14 Departments (B.Tech programs)
- 14 Faculty members (one per department)
- 1 Admin user account
- 9 Period timings (class schedule periods)
- 45 Syllabus sessions (C Programming curriculum)
- 10 Lab programs (In-lab exercises)
- 125 Timetable entries (class schedule assignments)
- Video uploads tracking

RELATIONSHIPS:
- Faculties → Departments (many-to-one)
- TimetableEntries → Faculties (many-to-one)
- TimetableEntries → Departments (many-to-one)
- VideoUploads → Faculties (many-to-one)
    """)
    print("="*100 + "\n")

if __name__ == "__main__":
    main()
