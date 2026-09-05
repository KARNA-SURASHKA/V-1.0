# backend/app/firebase_admin.py
import os
import firebase_admin
from firebase_admin import credentials, auth

# Path to your service‑account JSON (set via env var or copied into the repo)
SERVICE_ACCOUNT_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)