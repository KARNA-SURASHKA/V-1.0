# backend/app/auth.py
"""Compatibility module.

The original codebase used ``backend/app/auth.py`` to expose the
``router``, ``get_current_user`` and ``require_role`` helpers.  After
switching to Firebase the actual implementation lives in
``backend/app/routers/auth_router.py``.  This shim simply re‑exports
those objects so that all existing imports in ``routers/*.py`` keep
working unchanged.
"""

from .routers.auth_router import (
    router,
    get_firebase_user,
    require_role,
)

get_current_user = get_firebase_user

__all__ = ["router", "get_firebase_user", "get_current_user", "require_role"]