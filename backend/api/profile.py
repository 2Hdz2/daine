"""
User Profile API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import logging

from database import (
    get_db,
    UserProfileCreate,
    UserProfileResponse,
)
from services.user_service import UserService
from api.auth import get_current_user
from database.models import User

logger = logging.getLogger(__name__)

router = APIRouter()


def get_current_user_id(
    current_user: User = Depends(get_current_user),
) -> int:
    """Extract current user ID from authenticated user."""
    return current_user.id


@router.post("/profile", response_model=UserProfileResponse, tags=["Profile"])
def create_profile(
    profile_create: UserProfileCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Create user dietary profile.
    """
    try:
        profile = UserService.create_user_profile(db, user_id, profile_create)
        return profile
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating profile",
        )


@router.get("/profile", response_model=Optional[UserProfileResponse], tags=["Profile"])
def get_profile(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get user dietary profile.
    """
    profile = UserService.get_user_profile(db, user_id)
    
    return profile


@router.put("/profile", response_model=UserProfileResponse, tags=["Profile"])
def update_profile(
    profile_update: UserProfileCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Update user dietary profile.
    """
    try:
        profile = UserService.update_user_profile(db, user_id, profile_update)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found",
            )
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating profile",
        )
