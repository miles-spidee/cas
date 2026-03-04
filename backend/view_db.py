from database import SessionLocal
from models import Department, Faculty, Admin, PeriodTiming, TimetableEntry, Syllabus, LabProgram
import json

def display_data():
    db = SessionLocal()
    
    print("\n" + "="*80)
    print("DATABASE CONTENTS - METAVIEW")
    print("="*80)
    
    # Departments
    print("\n\n📚 DEPARTMENTS")
    print("-" * 80)
    departments = db.query(Department).all()
    for dept in departments:
        print(f"  ID: {dept.id} | Name: {dept.name} | Code: {dept.code}")
    print(f"Total: {len(departments)} departments")
    
    # Admin
    print("\n\n👤 ADMIN USERS")
    print("-" * 80)
    admins = db.query(Admin).all()
    for admin in admins:
        print(f"  ID: {admin.id} | Username: {admin.username}")
    print(f"Total: {len(admins)} admin users")
    
    # Period Timings
    print("\n\n⏰ PERIOD TIMINGS")
    print("-" * 80)
    timings = db.query(PeriodTiming).all()
    for timing in timings:
        print(f"  Period {timing.period}: {timing.display_time}")
    print(f"Total: {len(timings)} periods")
    
    # Faculties
    print("\n\n👨‍🏫 FACULTIES")
    print("-" * 80)
    faculties = db.query(Faculty).all()
    for faculty in faculties:
        dept_name = faculty.department.name if faculty.department else "N/A"
        print(f"  {faculty.id}. {faculty.name}")
        print(f"     Email: {faculty.email} | Phone: {faculty.phone}")
        print(f"     Department: {dept_name}")
        print(f"     Experience: {faculty.experience} years | C: {faculty.c_exp} | Python: {faculty.py_exp}")
        if faculty.research:
            print(f"     Research: {faculty.research}")
        print()
    print(f"Total: {len(faculties)} faculties")
    
    # Syllabus
    print("\n\n📖 SYLLABUS SESSIONS (C Programming)")
    print("-" * 80)
    syllabus = db.query(Syllabus).all()
    current_unit = 0
    for session in syllabus:
        if session.unit != current_unit:
            current_unit = session.unit
            print(f"\n  UNIT {current_unit}:")
        print(f"    Session {session.session_number}: {session.session_title}")
        if session.ppt_url:
            print(f"      📊 PPT: {session.ppt_url}")
    print(f"\nTotal: {len(syllabus)} sessions")
    
    # Lab Programs
    print("\n\n🔬 LAB PROGRAMS")
    print("-" * 80)
    lab_programs = db.query(LabProgram).all()
    for prog in lab_programs:
        print(f"  Week {prog.program_number}: {prog.program_title}")
        print(f"    {prog.description[:100]}...")
        if prog.moodle_url:
            print(f"    Moodle: {prog.moodle_url}")
        print()
    print(f"Total: {len(lab_programs)} lab programs")
    
    # Timetable
    print("\n\n📅 TIMETABLE ENTRIES (Sample - First 10)")
    print("-" * 80)
    timetable = db.query(TimetableEntry).limit(10).all()
    for entry in timetable:
        faculty_name = entry.faculty.name if entry.faculty else "N/A"
        dept_code = entry.department.code if entry.department else "N/A"
        print(f"  {entry.day} | Period {entry.period} | {entry.class_type.upper()}")
        print(f"    Faculty: {faculty_name} | Dept: {dept_code} | Subject: {entry.subject}")
        print()
    
    all_timetable = db.query(TimetableEntry).all()
    print(f"Total: {len(all_timetable)} timetable entries")
    
    # Summary
    print("\n" + "="*80)
    print("DATABASE SUMMARY")
    print("="*80)
    print(f"  Departments:       {len(departments)}")
    print(f"  Faculties:         {len(faculties)}")
    print(f"  Admin Users:       {len(admins)}")
    print(f"  Period Timings:    {len(timings)}")
    print(f"  Syllabus Sessions: {len(syllabus)}")
    print(f"  Lab Programs:      {len(lab_programs)}")
    print(f"  Timetable Entries: {len(all_timetable)}")
    print("="*80 + "\n")
    
    db.close()

if __name__ == "__main__":
    display_data()
