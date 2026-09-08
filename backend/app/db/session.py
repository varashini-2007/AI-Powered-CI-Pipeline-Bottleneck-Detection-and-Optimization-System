"""
Database Session Management for SQLite.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.config import DATABASE_URL
from backend.app.models.db_models import Base

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite in FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
