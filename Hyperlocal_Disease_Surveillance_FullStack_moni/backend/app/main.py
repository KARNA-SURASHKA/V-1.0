from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, ensure_schema_compatibility
from . import models
from .feature_init import initialize_feature

from .routers.auth_router import router as auth_router
from .routers.locations import router as locations_router
from .routers.dashboard import router as dashboard_router
from .routers.agent import router as agent_router
from .routers.admin import router as admin_router
from .routers.medical_chat import router as medical_chat_router
from .routers.medical import router as medical_router
from .routers.medical_supervisor import (
    router as medical_supervisor_router
)
from .routers.home_relief import router as home_relief_router

# Medical Supervisor Management
from .routers.admin_supervisors import (
    router as admin_supervisors_router
)


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

models.Base.metadata.create_all(
    bind=engine
)

ensure_schema_compatibility()

initialize_feature()


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Hyperlocal Disease Surveillance API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        "http://localhost:5174",
        "http://127.0.0.1:5174",

        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],

    allow_origin_regex=(
        r"https?://"
        r"(localhost|127\.0\.0\.1)"
        r"(:\d+)?$"
    ),

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

    expose_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

# Authentication
app.include_router(
    auth_router
)


# Locations
app.include_router(
    locations_router
)


# User Dashboard
app.include_router(
    dashboard_router
)


# Agent
app.include_router(
    agent_router
)


# Admin
app.include_router(
    admin_router
)


# ============================================================
# ADMIN MEDICAL SUPERVISOR MANAGEMENT
# ============================================================
#
# Handles:
#
# GET    /admin/supervisors
# GET    /admin/supervisors/stats
# GET    /admin/supervisors/{id}
# POST   /admin/supervisors
# PUT    /admin/supervisors/{id}
# PATCH  /admin/supervisors/{id}/status
# DELETE /admin/supervisors/{id}
#
# ============================================================

app.include_router(
    admin_supervisors_router
)


# ============================================================
# MEDICAL SUPERVISOR PORTAL
# ============================================================

app.include_router(
    medical_supervisor_router
)


# ============================================================
# LEGACY MEDICAL ROUTES
# ============================================================

app.include_router(
    medical_router
)


# ============================================================
# AI MEDICAL CHATBOT
# ============================================================

app.include_router(
    medical_chat_router
)


# ============================================================
# HOME RELIEF
# ============================================================

app.include_router(
    home_relief_router
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get(
    "/health",
    tags=["system"]
)
def health():

    return {
        "ok": True,
        "service": "Hyperlocal Disease Surveillance API",
    }


# ============================================================
# ROOT
# ============================================================

@app.get(
    "/",
    tags=["system"]
)
def root():

    return {
        "message":
            "Hyperlocal Disease Surveillance API is running"
    }