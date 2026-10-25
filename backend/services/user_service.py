"""
User Management Service
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
import logging

from database.models import User, UserProfile
from database.schemas import UserCreate, UserProfileCreate
from services.security import hash_password, verify_password, create_access_token

logger = logging.getLogger(__name__)


class UserService:
    """Service for user management."""
    
    @staticmethod
    def create_user(db: Session, user_create: UserCreate) -> User:
        """Create a new user."""
        try:
            # Check if user exists
            existing = db.query(User).filter(User.email == user_create.email).first()
            if existing:
                raise ValueError(f"User with email {user_create.email} already exists")
            
            # Hash password
            hashed_pwd = hash_password(user_create.password)
            
            # Create user
            user = User(
                email=user_create.email,
                full_name=user_create.full_name,
                hashed_password=hashed_pwd,
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"User created: {user.email}")
            return user
        
        except IntegrityError:
            db.rollback()
            raise ValueError(f"User with email {user_create.email} already exists")
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    @staticmethod
    def authenticate_user(
        db: Session,
        email: str,
        password: str,
    ) -> Optional[User]:
        """Authenticate user by email and password."""
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user
    
    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create_user_profile(
        db: Session,
        user_id: int,
        profile_create: UserProfileCreate,
    ) -> UserProfile:
        """Create user dietary profile."""
        try:
            # Check if profile exists
            existing = db.query(UserProfile).filter(
                UserProfile.user_id == user_id
            ).first()
            
            if existing:
                raise ValueError(f"Profile already exists for user {user_id}")
            
            # Create profile
            profile = UserProfile(
                user_id=user_id,
                dietary_condition=profile_create.dietary_condition,
                allergies=profile_create.allergies,
                intolerances=profile_create.intolerances,
                disliked_foods=profile_create.disliked_foods,
                nutritional_goals=profile_create.nutritional_goals,
                weight_objective=profile_create.weight_objective,
                preferred_meal_structure=profile_create.preferred_meal_structure,
            )
            
            db.add(profile)
            db.commit()
            db.refresh(profile)
            
            logger.info(f"Profile created for user {user_id}")
            return profile
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating profile: {str(e)}")
            raise
    
    @staticmethod
    def update_user_profile(
        db: Session,
        user_id: int,
        profile_update: UserProfileCreate,
    ) -> Optional[UserProfile]:
        """Update user dietary profile."""
        try:
            profile = db.query(UserProfile).filter(
                UserProfile.user_id == user_id
            ).first()
            
            if not profile:
                return None
            
            # Update fields
            profile.dietary_condition = profile_update.dietary_condition
            profile.allergies = profile_update.allergies
            profile.intolerances = profile_update.intolerances
            profile.disliked_foods = profile_update.disliked_foods
            profile.nutritional_goals = profile_update.nutritional_goals
            profile.weight_objective = profile_update.weight_objective
            profile.preferred_meal_structure = profile_update.preferred_meal_structure
            
            db.commit()
            db.refresh(profile)
            
            logger.info(f"Profile updated for user {user_id}")
            return profile
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating profile: {str(e)}")
            raise
    
    @staticmethod
    def get_user_profile(db: Session, user_id: int) -> Optional[UserProfile]:
        """Get user profile."""
        return db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()


def get_user_service() -> UserService:
    """Dependency for getting user service."""
    return UserService()
