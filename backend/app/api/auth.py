"""
Authentication API endpoints.

Handles Google OAuth login and domain validation.
"""
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from google.oauth2 import id_token
from google.auth.transport import requests
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class TokenRequest(BaseModel):
    """Request body for login endpoint."""
    token: str = Field(min_length=1)


class UserSession(BaseModel):
    """User session data returned after successful login."""
    email: str
    name: str
    picture: str = ""


class AuthConfig(BaseModel):
    """Authentication configuration exposed to frontend."""
    auth_enabled: bool
    dev_mode: bool
    google_client_id: str
    workspace_name: str


def _guest_user_session() -> UserSession:
    return UserSession(email="guest@local", name="Guest User", picture="")


def _validate_allowed_user(email: str) -> None:
    if not settings.ALLOWED_USERS:
        return

    allowed_users = {user.strip().casefold() for user in settings.ALLOWED_USERS if user.strip()}
    if email.casefold() not in allowed_users:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Your email is not in the allowed users list.",
        )


@router.get("/config", response_model=AuthConfig)
async def get_auth_config():
    """
    Get authentication configuration for the frontend.
    
    This allows the frontend to know whether to show the login page
    or go directly to the gallery.
    """
    return AuthConfig(
        auth_enabled=settings.AUTH_ENABLED,
        dev_mode=settings.DEV_MODE,
        google_client_id=settings.GOOGLE_CLIENT_ID,
        workspace_name=settings.WORKSPACE_NAME,
    )


@router.post("/login", response_model=UserSession)
async def login(request: TokenRequest):
    """
    Authenticate user with Google OAuth token.
    
    Validates the token, checks domain restrictions, and returns user session data.
    """
    # If auth is disabled, this endpoint shouldn't normally be called,
    # but handle gracefully just in case
    if not settings.AUTH_ENABLED:
        return _guest_user_session()
    
    try:
        # Verify the token with Google
        id_info = id_token.verify_oauth2_token(
            request.token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = (id_info.get("email") or "").strip()
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        _validate_allowed_user(email)

        return UserSession(
            email=email,
            name=id_info.get("name", email.split("@")[0]),
            picture=id_info.get("picture", "")
        )

    except ValueError:
        # Token verification failed
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        # Re-raise HTTP exceptions (like 403 for domain validation)
        raise
    except Exception:
        # Catch-all for unexpected errors
        logger.exception("Authentication error during Google OAuth login")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
