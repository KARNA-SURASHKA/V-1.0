"""One-time script: create a Firebase user for each existing local user
that doesn't have one yet, and store the resulting firebase_uid."""

from dotenv import load_dotenv
load_dotenv()

from firebase_admin import auth as firebase_auth, credentials, initialize_app
import os

cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
initialize_app(credentials.Certificate(cred_path))

from app.database import SessionLocal
from app import models

TEMP_PASSWORD = "ChangeMe123!"  # each user should reset this after first login

db = SessionLocal()
try:
    users = db.query(models.User).filter(models.User.firebase_uid.is_(None)).all()
    for user in users:
        email = f"{user.username}@yourdomain.com"  # adjust to your real email scheme
        try:
            fb_user = firebase_auth.get_user_by_email(email)
        except firebase_auth.UserNotFoundError:
            fb_user = firebase_auth.create_user(
                email=email,
                password=TEMP_PASSWORD,
                display_name=user.full_name,
            )
        user.firebase_uid = fb_user.uid
        print(f"Linked {user.username} -> {fb_user.uid}")
    db.commit()
finally:
    db.close()