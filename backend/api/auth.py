"""
Authentication API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

from database import get_db, LoginRequest, UserCreate, UserResponse, TokenResponse, SignupResponse
from database.models import User
from services.user_service import UserService
from services.security import create_access_token

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


@router.post("/auth/signup", response_model=SignupResponse, tags=["Auth"])
def signup(
    user_create: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new user account.
    """
    try:
        user = UserService.create_user(db, user_create)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=30),
        )
        return SignupResponse(access_token=access_token, user=user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user",
        )


@router.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate user and return JWT token.
    """
    user = UserService.authenticate_user(db, credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )
    
    return TokenResponse(access_token=access_token, token_type="bearer")


@router.get("/auth/me", response_model=UserResponse, tags=["Auth"])
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Get current authenticated user.
    """
    token = credentials.credentials
    from services.security import verify_token
    
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user_id = int(payload.get("sub"))
    user = UserService.get_user(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user


def get_current_user_id(
    current_user: User = Depends(get_current_user),
) -> int:
    """Extract the authenticated user's ID for protected routes."""
    return current_user.id
