"""
CREDENTIALS TABLE - Authentication & Password Management
========================================================

This document describes the Credentials table for handling email and password authentication.

TABLE STRUCTURE:
================

CREATE TABLE credentials (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,           -- User's email (unique identifier)
    password VARCHAR(255) NOT NULL,               -- Hashed password (bcrypt)
    user_type VARCHAR(50) NOT NULL,               -- 'admin' or 'faculty'
    user_id INTEGER,                              -- Reference to admin.id or faculty.id
    is_active BOOLEAN DEFAULT 1,                  -- Whether account is active
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Account creation timestamp
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
    last_login DATETIME,                          -- Last login timestamp
    login_attempts INTEGER DEFAULT 0,             -- Failed login attempts counter
    is_locked BOOLEAN DEFAULT 0                   -- Whether account is locked
);


CURRENT DATA:
=============

Total Credentials:  15
  - Admins:        1
  - Faculties:     14


SAMPLE DATA:
============

Admin Login:
  Email:    mail-admin@gmail.com
  Password: admin123 (hashed with bcrypt)
  Type:     admin

Faculty Logins (14 total):
  - r.sathish@kgkite.ac.in (Sathish R)
  - sikkandharbatcha.j@kgkite.ac.in (Sikkandhar Batcha J)
  - raakesh.m@kgkite.ac.in (Raakesh M)
  - aruna.r@kgkite.ac.in (Aruna R)
  - janani.s@kgkite.ac.in (Janani S)
  - indhumathi.s@kgkite.ac.in (Indhumathi S)
  - saranya.sh@kgkite.ac.in (Saranya S)
  - anusha.s@kgkite.ac.in (Anusha S)
  - kiruthikaa.r@kgkite.ac.in (Kiruthikaa R)
  - janani.r@kgkite.ac.in (Janani R)
  - Venkateshbabu.s@kgkite.ac.in (Venkatesh Babu S)
  - dhamayanthi.p@kgkite.ac.in (Dhamayanthi P)
  - pradeep.g@kgkite.ac.in (Pradeep G)
  - madhan.m@kgkite.ac.in (Madhan S)

Default Password: faculty123 (hashed with bcrypt)


KEY FEATURES:
=============

1. Password Security:
   - All passwords are hashed using bcrypt
   - Never stored in plain text
   - Salted for additional security

2. Account Management:
   - is_active: Can disable accounts without deleting them
   - is_locked: Temporarily lock account after failed login attempts
   - login_attempts: Track failed login attempts for security

3. Audit Trail:
   - created_at: When account was created
   - updated_at: When account was last modified
   - last_login: Track user activity

4. User Types:
   - 'admin': Administrator account (1 total)
   - 'faculty': Faculty member account (14 total)


PYTHON USAGE EXAMPLES:
======================

1. Adding a new credential:
   from models import Credentials
   from database import SessionLocal
   import bcrypt

   db = SessionLocal()
   
   def hash_password(password: str) -> str:
       salt = bcrypt.gensalt()
       return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
   
   new_cred = Credentials(
       email="user@example.com",
       password=hash_password("secretpassword"),
       user_type="faculty",
       user_id=5,
       is_active=True
   )
   db.add(new_cred)
   db.commit()

2. Authenticating a user:
   user = db.query(Credentials).filter(
       Credentials.email == "user@example.com"
   ).first()
   
   if user and bcrypt.checkpw(
       password.encode('utf-8'), 
       user.password.encode('utf-8')
   ):
       # Login successful
       user.last_login = datetime.utcnow()
       db.commit()
   else:
       # Login failed
       user.login_attempts += 1
       if user.login_attempts >= 5:
           user.is_locked = True
       db.commit()

3. Retrieving credentials by email:
   cred = db.query(Credentials).filter(
       Credentials.email == "r.sathish@kgkite.ac.in"
   ).first()

4. Getting all faculty credentials:
   faculties = db.query(Credentials).filter(
       Credentials.user_type == "faculty"
   ).all()

5. Resetting password:
   from datetime import datetime
   
   cred = db.query(Credentials).filter(
       Credentials.email == "user@example.com"
   ).first()
   
   cred.password = hash_password("newpassword")
   cred.updated_at = datetime.utcnow()
   cred.login_attempts = 0
   cred.is_locked = False
   db.commit()


SQL QUERIES:
============

-- Get all active credentials
SELECT * FROM credentials WHERE is_active = 1;

-- Find locked accounts
SELECT email, user_type FROM credentials WHERE is_locked = 1;

-- Get accounts with failed login attempts
SELECT email, login_attempts FROM credentials WHERE login_attempts > 0;

-- Get last login activity
SELECT email, last_login FROM credentials ORDER BY last_login DESC;

-- Count credentials by user type
SELECT user_type, COUNT(*) FROM credentials GROUP BY user_type;


SECURITY BEST PRACTICES:
========================

1. ✓ Passwords are hashed with bcrypt before storage
2. ✓ Email is unique to prevent duplicate accounts
3. ✓ Account locking after failed attempts
4. ✓ Audit trail with timestamps
5. ✓ Soft delete capability via is_active flag
6. ✓ User type separation for access control

Remember: NEVER log or display plain text passwords!
"""

def display_credentials_info():
    print(__doc__)

if __name__ == "__main__":
    display_credentials_info()
