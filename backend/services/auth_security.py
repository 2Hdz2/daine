"""
Enhanced Security and Authorization
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import logging

from database import get_db
from database.models import User
from services.security import verify_token
from services.user_service import UserService

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate JWT token and return authenticated user.
    All protected endpoints depend on this.
    """
    token = credentials.credentials
    
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = int(payload.get("sub"))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
        )
    
    user = UserService.get_user(db, user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure user is active (same as get_current_user for now).
    Can be extended for additional checks.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    
    return current_user


def verify_user_owns_resource(user_id: int, resource_owner_id: int):
    """
    Verify that the current user owns the resource they're trying to access.
    Prevents users from accessing other users' data.
    """
    if user_id != resource_owner_id:
        logger.warning(f"Unauthorized access attempt: user {user_id} tried to access resource of user {resource_owner_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this resource",
        )


class RateLimiter:
    """
    Simple in-memory rate limiter for API endpoints.
    In production, use Redis for distributed rate limiting.
    """
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = {}
    
    def is_allowed(self, user_id: int) -> bool:
        """Check if user is within rate limit."""
        from datetime import datetime, timedelta
        
        now = datetime.utcnow()
        key = f"{user_id}"
        
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove old requests (older than 1 minute)
        cutoff = now - timedelta(minutes=1)
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if req_time > cutoff
        ]
        
        # Check limit
        if len(self.requests[key]) >= self.requests_per_minute:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True


# Global rate limiter instance
rate_limiter = RateLimiter(requests_per_minute=100)


def check_rate_limit(user_id: int):
    """Rate limiting dependency."""
    if not rate_limiter.is_allowed(user_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 100 requests per minute.",
        )


class DataValidator:
    """Input validation and sanitization."""
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validate and sanitize email."""
        if not email or "@" not in email:
            raise ValueError("Invalid email format")
        return email.lower().strip()
    
    @staticmethod
    def validate_password(password: str) -> str:
        """Validate password strength."""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must contain digit")
        return password
    
    @staticmethod
    def validate_dietary_condition(condition: str) -> str:
        """Validate dietary condition."""
        valid_conditions = [
            "diabetes",
            "hypertension",
            "cardiovascular",
            "high_cholesterol",
            "weight_management",
            "general",
        ]
        if condition.lower() not in valid_conditions:
            raise ValueError(f"Invalid condition. Must be one of: {', '.join(valid_conditions)}")
        return condition.lower()
    
    @staticmethod
    def validate_quantity(quantity: float) -> float:
        """Validate food quantity."""
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        if quantity > 10000:
            raise ValueError("Quantity seems too large")
        return quantity
    
    @staticmethod
    def validate_rating(rating: int) -> int:
        """Validate user rating."""
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            raise ValueError("Rating must be integer between 1 and 5")
        return rating


# Authorization middleware/helpers
def require_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> User:
    """
    Ensure user has a complete profile.
    For endpoints that require profile to be set up.
    """
    profile = UserService.get_user_profile(db, current_user.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile must be completed first",
        )
    
    return current_user
