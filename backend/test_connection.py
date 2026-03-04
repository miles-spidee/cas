import os
import sys
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 60)
print("SUPABASE DATABASE CONNECTION TEST")
print("=" * 60)

# Mask password for display
masked_url = DATABASE_URL
if "@" in masked_url:
    parts = masked_url.split("@")
    pre = parts[0]
    colon_idx = pre.rfind(":")
    masked_url = pre[:colon_idx] + ":****@" + parts[1]
print(f"\nConnection URL: {masked_url}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        # Test basic connection
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"\n✅ CONNECTION SUCCESSFUL!")
        print(f"\nPostgreSQL Version: {version}")
        
        # Check current database
        result = conn.execute(text("SELECT current_database();"))
        db_name = result.fetchone()[0]
        print(f"Database: {db_name}")
        
        # Check current user
        result = conn.execute(text("SELECT current_user;"))
        user = result.fetchone()[0]
        print(f"User: {user}")
        
        # List existing tables
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result.fetchall()]
        print(f"\nExisting tables ({len(tables)}):")
        if tables:
            for t in tables:
                print(f"  - {t}")
        else:
            print("  (No tables yet)")
        
    print("\n" + "=" * 60)
    print("✅ DATABASE IS READY TO USE")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ CONNECTION FAILED!")
    print(f"\nError: {e}")
    print("\n" + "=" * 60)
    sys.exit(1)
