import os
import sys

# Add server directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models import User
from app.core.security import get_password_hash

def create_default_admin():
    db = SessionLocal()
    try:
        email = "admin@mzdata.com"
        password = "AdminPassword123!"
        
        existing_admin = db.query(User).filter(User.email == email).first()
        if existing_admin:
            print(f"Admin user {email} already exists.")
            existing_admin.role = "superadmin"
            existing_admin.hashed_password = get_password_hash(password)
            existing_admin.is_active = True
            db.commit()
            print(f"Updated {email} to superadmin and reset password.")
            return

        print(f"Creating default admin: {email}")
        
        new_admin = User(
            email=email,
            phone_number="08000000000",
            hashed_password=get_password_hash(password),
            role="superadmin",
            is_active=True,
            first_name="Admin",
            last_name="MzData",
            wallet_balance=0.0,
            has_transaction_pin=False,
            device_id="admin-bootstrap"
        )
        
        db.add(new_admin)
        db.commit()
        print(f"Successfully created admin user: {email} / {password}")
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_default_admin()
