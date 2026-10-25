"""
Meal Planning Service
Creates daily/weekly meal plans using recommendations.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

from database.models import MealPlan, PlannedMeal
from database.schemas import MealPlanCreate, PlannedMealCreate, MealPlanResponse
from services.recommendation_service import RecommendationService
from services.inventory_service import InventoryService

logger = logging.getLogger(__name__)


class MealPlanningService:
    """Service for creating and managing meal plans."""
    
    def __init__(self):
        self.rec_service = RecommendationService()
    
    def create_meal_plan(
        self,
        db: Session,
        user_id: int,
        plan_create: MealPlanCreate,
    ) -> MealPlan:
        """Create a new meal plan (daily or weekly)."""
        try:
            meal_plan = MealPlan(
                user_id=user_id,
                plan_type=plan_create.plan_type,
                start_date=plan_create.start_date,
                end_date=plan_create.end_date,
            )
            
            db.add(meal_plan)
            db.commit()
            
            # Add planned meals if provided
            if plan_create.meals:
                for meal in plan_create.meals:
                    planned_meal = PlannedMeal(
                        meal_plan_id=meal_plan.id,
                        meal_date=meal.meal_date,
                        meal_type=meal.meal_type,
                        food_id=meal.food_id,
                        food_name=meal.food_name,
                        suitability_score=meal.suitability_score,
                        reason=meal.reason,
                    )
                    db.add(planned_meal)
            
            db.commit()
            db.refresh(meal_plan)
            
            logger.info(f"Meal plan created: {meal_plan.id} for user {user_id}")
            return meal_plan
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating meal plan: {str(e)}")
            raise
    
    def get_meal_plan(
        self,
        db: Session,
        user_id: int,
        meal_plan_id: int,
    ) -> Optional[MealPlan]:
        """Get specific meal plan."""
        return db.query(MealPlan).filter(
            MealPlan.id == meal_plan_id,
            MealPlan.user_id == user_id,
        ).first()
    
    def get_user_meal_plans(
        self,
        db: Session,
        user_id: int,
        limit: int = 10,
    ) -> List[MealPlan]:
        """Get user's meal plans (recent first)."""
        return db.query(MealPlan).filter(
            MealPlan.user_id == user_id
        ).order_by(MealPlan.start_date.desc()).limit(limit).all()
    
    def generate_daily_plan(
        self,
        db: Session,
        user_id: int,
        plan_date: datetime,
        condition: str,
    ) -> Dict:
        """
        Generate a complete daily meal plan for a specific date.
        
        Default structure:
        - breakfast
        - lunch
        - dinner
        - 2 snacks (optional)
        
        Uses recommendations from inventory + ML model.
        """
        try:
            # Get user's inventory
            inventory = InventoryService.get_inventory_items(db, user_id)
            
            if not inventory:
                logger.warning(f"User {user_id} has no inventory")
                return {
                    "date": plan_date,
                    "message": "Please add items to your inventory first",
                    "meals": [],
                }
            
            # Get recommendations for each meal type
            meals = {}
            meal_types = ["breakfast", "lunch", "dinner"]
            
            for meal_type in meal_types:
                # Generate recommendations from available inventory
                # (This is simplified; in production, would match recipes to inventory)
                meal_recommendations = self._find_meal_matches(
                    db, user_id, condition, meal_type, inventory
                )
                
                if meal_recommendations:
                    # Take the top recommendation
                    best = meal_recommendations[0]
                    meals[meal_type] = {
                        "food_id": best["food_id"],
                        "food_name": best["food_name"],
                        "suitability_score": best["suitability_score"],
                        "reason": f"Recommended for {meal_type}",
                        "inventory_match": best.get("inventory_match", 0),
                    }
            
            return {
                "date": plan_date,
                "condition": condition,
                "meals": meals,
                "notes": "Daily meal plan generated based on inventory and suitability scores",
            }
        
        except Exception as e:
            logger.error(f"Error generating daily plan: {str(e)}", exc_info=True)
            raise
    
    def generate_weekly_plan(
        self,
        db: Session,
        user_id: int,
        start_date: datetime,
        condition: str,
    ) -> Dict:
        """Generate a complete weekly meal plan."""
        try:
            daily_plans = {}
            
            for day_offset in range(7):
                plan_date = start_date + timedelta(days=day_offset)
                day_name = plan_date.strftime("%A")
                
                daily_plan = self.generate_daily_plan(
                    db, user_id, plan_date, condition
                )
                
                daily_plans[day_name] = daily_plan
            
            return {
                "week_start": start_date,
                "condition": condition,
                "daily_plans": daily_plans,
                "notes": "Weekly meal plan generated from daily recommendations",
            }
        
        except Exception as e:
            logger.error(f"Error generating weekly plan: {str(e)}", exc_info=True)
            raise
    
    def _find_meal_matches(
        self,
        db: Session,
        user_id: int,
        condition: str,
        meal_type: str,
        inventory: List,
    ) -> List[Dict]:
        """Find meal recommendations matching user's inventory."""
        # Extract food names from inventory
        available_foods = [item.food_name for item in inventory]
        
        # Get all recommendations for condition
        recommendations = self.rec_service.get_recommendations_for_condition(
            condition=condition,
            filter_blocked=True,
        )
        
        # Filter to foods that match inventory
        matches = []
        for rec in recommendations["recommended"] + recommendations["moderate"]:
            if any(food.lower() in rec.food_name.lower() for food in available_foods):
                matches.append({
                    "food_id": rec.food_id,
                    "food_name": rec.food_name,
                    "suitability_score": rec.suitability_score,
                    "inventory_match": sum(
                        1 for food in available_foods 
                        if food.lower() in rec.food_name.lower()
                    ),
                })
        
        # Sort by suitability score
        matches.sort(key=lambda x: x["suitability_score"], reverse=True)
        return matches
    
    def add_planned_meal(
        self,
        db: Session,
        user_id: int,
        meal_plan_id: int,
        meal: PlannedMealCreate,
    ) -> PlannedMeal:
        """Add a meal to an existing meal plan."""
        try:
            # Verify meal plan belongs to user
            meal_plan = self.get_meal_plan(db, user_id, meal_plan_id)
            if not meal_plan:
                raise ValueError("Meal plan not found")
            
            planned_meal = PlannedMeal(
                meal_plan_id=meal_plan_id,
                meal_date=meal.meal_date,
                meal_type=meal.meal_type,
                food_id=meal.food_id,
                food_name=meal.food_name,
                suitability_score=meal.suitability_score,
                reason=meal.reason,
            )
            
            db.add(planned_meal)
            db.commit()
            db.refresh(planned_meal)
            
            logger.info(f"Meal added to plan {meal_plan_id}")
            return planned_meal
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error adding meal to plan: {str(e)}")
            raise
    
    def mark_meal_eaten(
        self,
        db: Session,
        user_id: int,
        planned_meal_id: int,
    ) -> Optional[PlannedMeal]:
        """Mark a planned meal as eaten."""
        try:
            planned_meal = db.query(PlannedMeal).join(MealPlan).filter(
                PlannedMeal.id == planned_meal_id,
                MealPlan.user_id == user_id,
            ).first()
            
            if not planned_meal:
                return None
            
            planned_meal.was_eaten = True
            db.commit()
            db.refresh(planned_meal)
            
            logger.info(f"Planned meal {planned_meal_id} marked as eaten")
            return planned_meal
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error marking meal eaten: {str(e)}")
            raise


def get_meal_planning_service() -> MealPlanningService:
    """Dependency for getting meal planning service."""
    return MealPlanningService()
