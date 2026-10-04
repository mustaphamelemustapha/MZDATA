from app.core.database import SessionLocal
from app.models import User
from app.api.v1.endpoints.data import list_data_plans
from fastapi import BackgroundTasks

class DummyBackgroundTasks(BackgroundTasks):
    def add_task(self, func, *args, **kwargs):
        pass

db = SessionLocal()
user = db.query(User).first()
if user:
    plans = list_data_plans(DummyBackgroundTasks(), user, db)
    print(f"Success! Plans count: {len(plans)}")
else:
    print("No user")
