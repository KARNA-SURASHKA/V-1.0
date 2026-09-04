# backend/app/main.py
from __future__ import annotations

"""FastAPI application entry point.

The routes and dependencies defined in *routers/*.py are included
here, and the database schema is created automatically at
start‑up.
"""

import os
from typing import Iterable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
from .database import ensure_schema_compatibility, SessionLocal

# ---------------------------------------------------------------------------
# Routers – relative imports make this package self‑contained
# ---------------------------------------------------------------------------
from .routers import health_router,\
    security_router, dashboard_router, patient_management_router,\
    analytics_router, ml_router, monitoring_router, documentation_router
from .routers import deploying_stub as deployments_router
from .routers import serving_validator as serving_router
from .routers import verification_validator as verification_router

# ---------------------------------------------------------------------------
# Sentry error reporting – optional
# ---------------------------------------------------------------------------
try:
    import sentry_sdk as sentry
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    if os.getenv("SENTRY_DSN"):
        sentry.init(
            dsn=os.getenv("SENTRY_DSN"),
            traces_sample_rate=0.2,
            integrations=[FastApiIntegration()]
        )
except Exception:  # pragma: no cover
    pass

# ---------------------------------------------------------------------------
# FastAPI application setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Health Data Platform API",
    description="Provides endpoints for medical data ingestion, analysis and reporting.",
    version="1.0.0"
)

# Allow all origins – fine for local debugging; customise for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Logging config – avoid duplicate logs when run under a process manager
# ---------------------------------------------------------------------------
import logging
logging.getLogger("uvicorn.error").propagate = False

# ---------------------------------------------------------------------------
# Database cleanup – ensures the schema is up‑to‑date on every run
# ---------------------------------------------------------------------------
ensure_schema_compatibility()

# ---------------------------------------------------------------------------
# Register routers – PUBLIC routers first
# ---------------------------------------------------------------------------
app.include_router(health_router.router, tags=["public"], prefix="/")
app.include_router(security_router.router, tags=["security"], prefix="/security")
app.include_router(dashboard_router.router, tags=["dashboard"], prefix="/dashboard")
app.include_router(patient_management_router.router, tags=["patient"], prefix="/patient-management")
app.include_router(analytics_router.router, tags=["analytics"], prefix="/analytics")
app.include_router(ml_router.router, tags=["ml"], prefix="/ml")
app.include_router(monitoring_router.router, tags=["monitoring"], prefix="/monitoring")
app.include_router(documentation_router.router, tags=["documentation"], prefix="/documentation")
app.include_router(deployments_router.router, tags=["deployments"], prefix="/deployments")
app.include_router(serving_router.router, tags=["serving"], prefix="/serving")
app.include_router(verification_router.router, tags=["verification"], prefix="/verification")

# ---------------------------------------------------------------------------
# Feature initialization on startup – this creates initial data if missing
# ---------------------------------------------------------------------------
from .feature_init import initialize_feature
initialize_feature()

# ---------------------------------------------------------------------------
# Route for issue diagnostics – optional peer review testing helper
# ---------------------------------------------------------------------------
# ``pyright`` will flag the unused import; the guard keeps linting clean
# ---------------------------------------------------------------------------
try:
    from .test_imports import test_param # pragma: no cover
except Exception:  # pragma: no cover
    pass

__all__ = ["app"]
