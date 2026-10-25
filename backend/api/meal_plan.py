"""
Meal Planning API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import logging

from database import get_db, MealPlanCreate, MealPlanResponse, PlannedMealCreate, PlannedMealResponse
from services.meal_planning_service import MealPlanningService
from api.auth import get_current_user_id
from services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/meal-plans",
    response_model=MealPlanResponse,
    tags=["Meal Planning"],
)
def create_meal_plan(
    plan_create: MealPlanCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Create a new meal plan (daily or weekly).
    """
    try:
        planning_service = MealPlanningService()
        meal_plan = planning_service.create_meal_plan(db, user_id, plan_create)
        return meal_plan
    except Exception as e:
        logger.error(f"Error creating meal plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating meal plan",
        )


@router.get(
    "/meal-plans",
    response_model=List[MealPlanResponse],
    tags=["Meal Planning"],
)
def get_meal_plans(
    limit: int = 10,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get user's meal plans (most recent first).
    """
    planning_service = MealPlanningService()
    plans = planning_service.get_user_meal_plans(db, user_id, limit=limit)
    return plans


@router.get(
    "/meal-plans/{meal_plan_id}",
    response_model=MealPlanResponse,
    tags=["Meal Planning"],
)
def get_meal_plan(
    meal_plan_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get specific meal plan with all planned meals.
    """
    planning_service = MealPlanningService()
    meal_plan = planning_service.get_meal_plan(db, user_id, meal_plan_id)
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found",
        )
    
    return meal_plan


@router.post(
    "/meal-plans/generate-daily",
    tags=["Meal Planning"],
)
def generate_daily_meal_plan(
    plan_date: datetime,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Generate a complete daily meal plan for a specific date.
    
    Uses:
    - User's dietary condition
    - Available inventory
    - Suitability recommendations
    """
    try:
        profile = UserService.get_user_profile(db, user_id)
        
        if not profile or not profile.dietary_condition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User profile with dietary condition required",
            )
        
        planning_service = MealPlanningService()
        daily_plan = planning_service.generate_daily_plan(
            db, user_id, plan_date, profile.dietary_condition
        )
        
        return daily_plan
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating daily plan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating meal plan",
        )


@router.post(
    "/meal-plans/generate-weekly",
    tags=["Meal Planning"],
)
def generate_weekly_meal_plan(
    start_date: datetime,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Generate a complete weekly meal plan.
    
    Generates daily plans for 7 days starting from start_date.
    """
    try:
        profile = UserService.get_user_profile(db, user_id)
        
        if not profile or not profile.dietary_condition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User profile with dietary condition required",
            )
        
        planning_service = MealPlanningService()
        weekly_plan = planning_service.generate_weekly_plan(
            db, user_id, start_date, profile.dietary_condition
        )
        
        return weekly_plan
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating weekly plan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating meal plan",
        )


@router.post(
    "/meal-plans/{meal_plan_id}/meals",
    response_model=PlannedMealResponse,
    tags=["Meal Planning"],
)
def add_meal_to_plan(
    meal_plan_id: int,
    meal: PlannedMealCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Add a meal to an existing meal plan.
    """
    try:
        planning_service = MealPlanningService()
        planned_meal = planning_service.add_planned_meal(db, user_id, meal_plan_id, meal)
        return planned_meal
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error adding meal to plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding meal",
        )


@router.patch(
    "/meal-plans/meals/{meal_id}/eat",
    tags=["Meal Planning"],
)
def mark_meal_eaten(
    meal_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Mark a planned meal as eaten.
    """
    planning_service = MealPlanningService()
    planned_meal = planning_service.mark_meal_eaten(db, user_id, meal_id)
    
    if not planned_meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planned meal not found",
        )
    
    return {
        "message": "Meal marked as eaten",
        "meal_id": meal_id,
        "was_eaten": planned_meal.was_eaten,
    }
