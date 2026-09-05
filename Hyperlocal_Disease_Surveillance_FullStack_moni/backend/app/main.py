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
from .routers.medical_supervisor import router as medical_supervisor_router
from .routers.home_relief import router as home_relief_router


# ============================================================
# DATABASE
# ============================================================

models.Base.metadata.create_all(
    bind=engine
)

# Keep existing databases compatible with the current model definitions.
ensure_schema_compatibility()

# Ensure the Medical Supervisor feature registry/account exists without
# reseeding or replacing existing surveillance data.
initialize_feature()


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Hyperlocal Disease Surveillance API"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    # Also permit another local Vite port (5174, 5175, etc.) during development.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

    expose_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"],
)

app.include_router(
    locations_router
)

app.include_router(
    dashboard_router
)

app.include_router(
    agent_router
)

app.include_router(
    admin_router
)

# District-scoped Medical Supervisor API.
# This router is registered before the legacy medical router so that
# supervisor requests can never escape the assigned district.
app.include_router(
    medical_supervisor_router
)

# Legacy Medical Supervisor / Home Relief endpoints.
app.include_router(
    medical_router
)

# AI Medical Chatbot
app.include_router(
    medical_chat_router
)

# Public approved Home Relief search
app.include_router(
    home_relief_router
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {"ok": True, "service": "Hyperlocal Disease Surveillance API"}


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message":
            "Hyperlocal Disease Surveillance API is running"
    }