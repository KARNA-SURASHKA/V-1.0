from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from . import models

from .routers.auth_router import router as auth_router
from .routers.locations import router as locations_router
from .routers.dashboard import router as dashboard_router
from .routers.agent import router as agent_router
from .routers.admin import router as admin_router
from .routers.medical_chat import router as medical_chat_router
from .routers.medical import router as medical_router
from .routers.home_relief import router as home_relief_router


# ============================================================
# DATABASE
# ============================================================

models.Base.metadata.create_all(
    bind=engine
)


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

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

    expose_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth_router
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

# Medical Supervisor
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
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message":
            "Hyperlocal Disease Surveillance API is running"
    }