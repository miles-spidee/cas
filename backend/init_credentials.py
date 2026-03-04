from database import engine, SessionLocal
from models import Base, Credentials, Faculty, Admin
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def init_credentials():
    """Initialize the credentials table with existing faculty and admin data"""
    
    # Create the credentials table
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if credentials already exist
    existing_creds = db.query(Credentials).first()
    if existing_creds:
        print("Credentials table already populated!")
        db.close()
        return
    
    print("Initializing Credentials table...")
    
    # Add admin credentials
    print("\n📌 Adding Admin Credentials...")
    admins = db.query(Admin).all()
    for admin in admins:
        cred = Credentials(
            email=admin.username,  # Username is email-style
            password=admin.password,  # Already hashed in Admin table
            user_type='admin',
            user_id=admin.id,
            is_active=True
        )
        db.add(cred)
        print(f"  ✓ Admin: {admin.username}")
    
    # Add faculty credentials
    print("\n👨‍🏫 Adding Faculty Credentials...")
    faculties = db.query(Faculty).all()
    for faculty in faculties:
        cred = Credentials(
            email=faculty.email,
            password=faculty.password,  # Already hashed
            user_type='faculty',
            user_id=faculty.id,
            is_active=True
        )
        db.add(cred)
        print(f"  ✓ Faculty: {faculty.email}")
    
    db.commit()
    
    # Display summary
    print("\n" + "="*80)
    print("CREDENTIALS TABLE INITIALIZED")
    print("="*80)
    
    total_creds = db.query(Credentials).count()
    print(f"\nTotal credentials created: {total_creds}")
    
    print("\n📊 Credentials Summary:")
    admin_count = db.query(Credentials).filter(Credentials.user_type == 'admin').count()
    faculty_count = db.query(Credentials).filter(Credentials.user_type == 'faculty').count()
    
    print(f"  - Admins:    {admin_count}")
    print(f"  - Faculties: {faculty_count}")
    
    print("\n📝 Sample Credentials Created:")
    print(f"  Admin Login:    mail-admin@gmail.com / admin123")
    print(f"  Faculty Logins: [email addresses from faculty table]")
    
    print("\n" + "="*80 + "\n")
    
    db.close()

if __name__ == "__main__":
    init_credentials()
