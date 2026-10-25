"""
What-If Analysis API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from database import get_db, WhatIfRequest, WhatIfResponse
from services.what_if_service import WhatIfService
from api.auth import get_current_user_id
from services.recommendation_service import RecommendationService
from services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/what-if/analyze",
    tags=["What-If Analysis"],
)
def analyze_what_if(
    request: WhatIfRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Perform what-if/counterfactual analysis.
    
    Example request:
    {
        "original_food_id": "F0001",
        "modification": "reduce sodium by 30%",
        "modified_features": {
            "sodium_mg": 350
        }
    }
    
    This will:
    1. Evaluate original food
    2. Modify specified features
    3. Re-evaluate modified version
    4. Show score change and feature impact
    """
    try:
        profile = UserService.get_user_profile(db, user_id)
        
        if not profile or not profile.dietary_condition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User profile with dietary condition required",
            )
        
        what_if_service = WhatIfService()
        
        # Perform analysis
        analysis = what_if_service.analyze_what_if(
            food_id=request.original_food_id,
            condition=profile.dietary_condition,
            modified_features=request.modified_features or {},
            description=request.modification,
        )
        
        if "error" in analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=analysis["error"],
            )
        
        # Save to database
        what_if_service.save_analysis(db, user_id, analysis)
        
        return {
            "original_food": analysis["original"]["food_name"],
            "condition": profile.dietary_condition,
            "modification": request.modification,
            "original_score": analysis["original"].get("suitability_score"),
            "modified_score": analysis["modified"].get("suitability_score"),
            "score_change": analysis["score_change"],
            "improvement": analysis["improvement"],
            "original_label": analysis["original"].get("predicted_label"),
            "modified_label": analysis["modified"].get("predicted_label"),
            "original_blocked": not analysis["original"].get("rule_pass"),
            "modified_blocked": not analysis["modified"].get("rule_pass"),
            "block_reason_if_modified": analysis["modified"].get("rule_block_reason"),
            "shap_changes": analysis["shap_changes"],
            "original_shap": analysis["original"].get("shap_contributions"),
            "modified_shap": analysis["modified"].get("shap_contributions"),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in what-if analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error performing analysis",
        )


@router.get(
    "/what-if/history",
    tags=["What-If Analysis"],
)
def get_what_if_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get user's what-if analysis history.
    """
    from database.models import WhatIfAnalysis
    
    records = db.query(WhatIfAnalysis).filter(
        WhatIfAnalysis.user_id == user_id
    ).order_by(WhatIfAnalysis.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": rec.id,
            "food": rec.original_food_id,
            "modification": rec.modification_description,
            "original_score": rec.original_score,
            "modified_score": rec.modified_score,
            "score_change": rec.modified_score - rec.original_score if rec.original_score else None,
            "created_at": rec.created_at,
        }
        for rec in records
    ]
