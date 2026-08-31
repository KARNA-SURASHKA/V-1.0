import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

# backend/
# ├── surveillance.db
# └── app/
#     └── database.py

BASE_DIR = Path(__file__).resolve().parents[1]

DEFAULT_DATABASE_PATH = BASE_DIR / "surveillance.db"

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"sqlite:///{DEFAULT_DATABASE_PATH.as_posix()}"
)


# ============================================================
# DATABASE ENGINE
# ============================================================

connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


Base = declarative_base()


# ============================================================
# DATABASE SESSION
# ============================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# SCHEMA COMPATIBILITY
# ============================================================

def ensure_schema_compatibility():

    """Apply small SQLite schema additions for existing surveillance.db files."""

    if not DATABASE_URL.startswith("sqlite"):
        return

    inspector = inspect(engine)

    if "users" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("users")
    }

    if "is_active" not in columns:

        with engine.begin() as connection:

            connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"
                )
            )

    # District scoping for Medical Supervisor accounts.
    if "supervisor_district_id" not in columns:

        with engine.begin() as connection:

            connection.execute(
                text(
                    "ALTER TABLE users ADD COLUMN supervisor_district_id INTEGER"
                )
            )