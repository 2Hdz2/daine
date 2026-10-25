"""
Ingredient Substitution API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from database import get_db, SubstitutionRequest
from services.substitution_service import SubstitutionService
from api.auth import get_current_user_id
from services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/substitutions/find/{ingredient}",
    tags=["Substitutions"],
)
def find_ingredient_substitutes(
    ingredient: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Find compatible substitute ingredients.
    
    Returns top 5 substitutes ranked by:
    1. Nutritional similarity
    2. ML suitability score for user's condition
    3. Safety (doesn't violate hard rules)
    """
    try:
        profile = UserService.get_user_profile(db, user_id)
        
        if not profile or not profile.dietary_condition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User profile with dietary condition required",
            )
        
        sub_service = SubstitutionService()
        substitutes = sub_service.find_substitutes(
            ingredient_name=ingredient,
            condition=profile.dietary_condition,
        )
        
        return {
            "ingredient": ingredient,
            "condition": profile.dietary_condition,
            "substitutes": substitutes,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding substitutes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error finding substitutes",
        )


@router.post(
    "/substitutions/evaluate",
    tags=["Substitutions"],
)
def evaluate_substitution(
    request: SubstitutionRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Evaluate how a specific substitution affects the recommendation.
    
    Example request:
    {
        "original_food_id": "F0001",
        "original_ingredient": "chicken",
        "substitute_ingredient": "egg"
    }
    
    Returns:
    - Suitability score comparison
    - Nutritional changes
    - Recommendation
    - Safety assessment
    """
    try:
        profile = UserService.get_user_profile(db, user_id)
        
        if not profile or not profile.dietary_condition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User profile with dietary condition required",
            )
        
        sub_service = SubstitutionService()
        
        # If food_id format is provided, use directly
        # Otherwise find foods matching ingredient names
        from database.models import Food
        
        # Find substitute food by name
        substitute_foods = db.query(Food).filter(
            Food.food_name.ilike(f"%{request.substitute_ingredient}%"),
            Food.condition == profile.dietary_condition,
        ).all()
        
        if not substitute_foods:
            # Try to find from ML data
            from ml.model_loader import ModelLoader
            loader = ModelLoader()
            models, encoders, data = loader.load_models(
                __import__("config").settings.data_path
            )
            
            sub_data = data[
                data["food_name"].str.contains(
                    request.substitute_ingredient, case=False, na=False
                ) & (data["condition"] == profile.dietary_condition)
            ]
            
            if sub_data.empty:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Substitute ingredient not found: {request.substitute_ingredient}",
                )
            
            sub_food_id = sub_data.iloc[0]["food_id"]
        else:
            sub_food_id = substitute_foods[0].food_id
        
        # Evaluate substitution
        result = sub_service.evaluate_substitution(
            original_food_id=request.original_food_id,
            substitute_food_id=sub_food_id,
            condition=profile.dietary_condition,
        )
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"],
            )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating substitution: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error evaluating substitution",
        )
