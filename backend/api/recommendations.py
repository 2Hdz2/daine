"""
Recommendations API routes
Exposes the ML pipeline through REST endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from database import (
    get_db,
    GenerateRecommendationRequest,
    RecommendationResponse,
    Recommendation,
)
from services.recommendation_service import RecommendationService
from api.auth import get_current_user_id
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/recommendations/single",
    response_model=RecommendationResponse,
    tags=["Recommendations"],
)
def get_single_recommendation(
    request: GenerateRecommendationRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get recommendation for a specific food item.
    
    This runs the complete pipeline:
    1. Retrieve food item
    2. Apply hard rule filter
    3. Calculate suitability score (if passes rules)
    4. Generate SHAP explanation
    """
    try:
        # Get user's condition from profile
        from services.user_service import UserService
        profile = UserService.get_user_profile(db, user_id)
        
        if not profile or not profile.dietary_condition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User profile with dietary condition required",
            )
        
        # Generate recommendation
        rec_service = RecommendationService()
        recommendation = rec_service.get_recommendation_for_food(
            food_id=request.food_id,
            condition=profile.dietary_condition,
            model_type=request.model_type,
        )
        
        if recommendation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Food not found",
            )
        
        # Store recommendation in database
        rec_record = Recommendation(
            user_id=user_id,
            food_id=recommendation.food_id,
            food_name=recommendation.food_name,
            condition=profile.dietary_condition,
            rule_pass=recommendation.rule_pass,
            rule_block_reason=recommendation.rule_block_reason,
            predicted_label=recommendation.predicted_label,
            suitability_score=recommendation.suitability_score,
            class_probabilities=str(recommendation.class_probabilities),
            shap_explanation=str(
                [s.dict() for s in recommendation.shap_contributions]
                if recommendation.shap_contributions else []
            ),
            model_type=request.model_type,
        )
        db.add(rec_record)
        db.commit()
        
        return recommendation
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recommendation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating recommendation",
        )


@router.get(
    "/recommendations/all",
    tags=["Recommendations"],
)
def get_all_recommendations_for_condition(
    model_type: str = "tree",
    limit: int = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get all recommendations for user's dietary condition.
    
    Returns sorted recommendations organized by category:
    - recommended
    - moderate
    - rejected (blocked by hard rules)
    """
    try:
        from services.user_service import UserService
        profile = UserService.get_user_profile(db, user_id)
        
        if not profile or not profile.dietary_condition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User profile with dietary condition required",
            )
        
        rec_service = RecommendationService()
        recommendations = rec_service.get_recommendations_for_condition(
            condition=profile.dietary_condition,
            model_type=model_type,
            limit=limit,
            filter_blocked=False,
        )
        
        return {
            "condition": profile.dietary_condition,
            "model_type": model_type,
            "recommended": recommendations["recommended"],
            "moderate": recommendations["moderate"],
            "rejected": recommendations["rejected"],
            "total": sum(len(v) for v in recommendations.values()),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching recommendations",
        )


@router.get(
    "/recommendations/history",
    response_model=List[RecommendationResponse],
    tags=["Recommendations"],
)
def get_recommendation_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get user's recommendation history (previously generated recommendations).
    """
    records = db.query(Recommendation).filter(
        Recommendation.user_id == user_id
    ).order_by(Recommendation.created_at.desc()).limit(limit).all()
    
    # Convert to response schema
    recommendations = []
    for rec in records:
        import json
        try:
            class_probs = json.loads(rec.class_probabilities)
            shap_contribs = json.loads(rec.shap_explanation)
        except:
            class_probs = {}
            shap_contribs = []
        
        recommendations.append(RecommendationResponse(
            food_id=rec.food_id,
            food_name=rec.food_name,
            condition=rec.condition,
            rule_pass=rec.rule_pass,
            rule_block_reason=rec.rule_block_reason,
            predicted_label=rec.predicted_label,
            suitability_score=rec.suitability_score,
            class_probabilities=class_probs,
            shap_contributions=shap_contribs,
        ))
    
    return recommendations
