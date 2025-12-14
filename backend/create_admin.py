from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Create admin user
        hashed_password = pwd_context.hash("admin1234")
        admin_user = User(
            username="admin",
            hashed_password=hashed_password,
            is_guest=False,
            credits=1000000,
            owned_themes="default,spring,summer,autumn,winter,cyber,animal,fruit,sf,space",
            equipped_theme="default",
            total_solved=0
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"✅ Admin user created successfully!")
        print(f"   Username: admin")
        print(f"   Password: admin1234")
        print(f"   Credits: 1,000,000")
        print(f"   ID: {admin_user.id}")
    except Exception as e:
        import traceback
        print(f"❌ Error creating admin: {e}")
        print("Full traceback:")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
