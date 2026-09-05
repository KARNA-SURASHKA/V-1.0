# backend/app/database.py

import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

# ============================================================
# DATABASE CONFIGURATION
# ============================================================
# By default the DB is a local SQLite file called
#   surveillance.db
# under the repo root.  You can override this by setting the
#   DATABASE_URL environment variable (e.g. a Postgres URI).
# ============================================================
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

# ============================================================
# DATABASE SESSION
# ============================================================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

# ============================================================
# GET A Session (FastAPI dependency helper)
# ============================================================
def get_db():
    """Yield a SQLAlchemy session and close it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================
# SCHEMA COMPATIBILITY
# ============================================================
def ensure_schema_compatibility():
    """
    If the repo already has an SQLite db file we add the missing
    columns that were introduced in later releases.
    """
    if not DATABASE_URL.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        # No users table → nothing to patch
        return

    columns = {column["name"] for column in inspector.get_columns("users")}

    # 1️⃣ Add is_active column if missing
    if "is_active" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"
                )
            )

    # 2️⃣ Add supervisor_district_id column if missing
    if "supervisor_district_id" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN supervisor_district_id INTEGER")
            )

    # 3️⃣ Add firebase_uid column & index if missing
    if "firebase_uid" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN firebase_uid TEXT"))
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_users_firebase_uid "
                    "ON users(firebase_uid)"
                )
            )

# Run the compatibility helper immediately so the DB is up‑to‑date
ensure_schema_compatibility()