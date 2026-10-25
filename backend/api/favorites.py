"""
Favorites and History API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from database import get_db, FavoriteMealCreate, FavoriteMealResponse
from database.models import FavoriteMeal, Recommendation
from api.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/favorites",
    response_model=FavoriteMealResponse,
    tags=["Favorites"],
)
def add_favorite_meal(
    favorite_create: FavoriteMealCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Add a meal to user's favorite meals.
    """
    try:
        # Check if already favorited
        existing = db.query(FavoriteMeal).filter(
            FavoriteMeal.user_id == user_id,
            FavoriteMeal.food_id == favorite_create.food_id,
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This meal is already in favorites",
            )
        
        favorite = FavoriteMeal(
            user_id=user_id,
            food_id=favorite_create.food_id,
            food_name=favorite_create.food_name,
            user_rating=favorite_create.user_rating,
            notes=favorite_create.notes,
        )
        
        db.add(favorite)
        db.commit()
        db.refresh(favorite)
        
        logger.info(f"Favorite added for user {user_id}: {favorite.food_name}")
        return favorite
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding favorite: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding favorite",
        )


@router.get(
    "/favorites",
    response_model=List[FavoriteMealResponse],
    tags=["Favorites"],
)
def get_favorite_meals(
    limit: int = 50,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get user's favorite meals.
    """
    favorites = db.query(FavoriteMeal).filter(
        FavoriteMeal.user_id == user_id
    ).order_by(FavoriteMeal.added_at.desc()).limit(limit).all()
    
    return favorites


@router.get(
    "/favorites/{favorite_id}",
    response_model=FavoriteMealResponse,
    tags=["Favorites"],
)
def get_favorite_meal(
    favorite_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get specific favorite meal.
    """
    favorite = db.query(FavoriteMeal).filter(
        FavoriteMeal.id == favorite_id,
        FavoriteMeal.user_id == user_id,
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found",
        )
    
    return favorite


@router.put(
    "/favorites/{favorite_id}",
    response_model=FavoriteMealResponse,
    tags=["Favorites"],
)
def update_favorite_meal(
    favorite_id: int,
    favorite_update: FavoriteMealCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Update a favorite meal (rating, notes).
    """
    try:
        favorite = db.query(FavoriteMeal).filter(
            FavoriteMeal.id == favorite_id,
            FavoriteMeal.user_id == user_id,
        ).first()
        
        if not favorite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Favorite not found",
            )
        
        if favorite_update.user_rating is not None:
            favorite.user_rating = favorite_update.user_rating
        
        if favorite_update.notes is not None:
            favorite.notes = favorite_update.notes
        
        db.commit()
        db.refresh(favorite)
        
        logger.info(f"Favorite updated: {favorite_id}")
        return favorite
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating favorite: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating favorite",
        )


@router.delete(
    "/favorites/{favorite_id}",
    tags=["Favorites"],
)
def delete_favorite_meal(
    favorite_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Remove a meal from favorites.
    """
    try:
        favorite = db.query(FavoriteMeal).filter(
            FavoriteMeal.id == favorite_id,
            FavoriteMeal.user_id == user_id,
        ).first()
        
        if not favorite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Favorite not found",
            )
        
        db.delete(favorite)
        db.commit()
        
        logger.info(f"Favorite deleted: {favorite_id}")
        return {"message": "Favorite removed"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting favorite: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting favorite",
        )


@router.get(
    "/history/recommendations",
    tags=["History"],
)
def get_recommendation_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get user's recommendation history.
    Shows all previously generated recommendations.
    """
    records = db.query(Recommendation).filter(
        Recommendation.user_id == user_id
    ).order_by(Recommendation.created_at.desc()).limit(limit).all()
    
    import json
    
    return [
        {
            "id": rec.id,
            "food_id": rec.food_id,
            "food_name": rec.food_name,
            "condition": rec.condition,
            "rule_pass": rec.rule_pass,
            "predicted_label": rec.predicted_label,
            "suitability_score": rec.suitability_score,
            "model_type": rec.model_type,
            "created_at": rec.created_at,
            "class_probabilities": (
                json.loads(rec.class_probabilities)
                if rec.class_probabilities else {}
            ),
        }
        for rec in records
    ]


@router.get(
    "/history/stats",
    tags=["History"],
)
def get_user_stats(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get user statistics (recommendation count, favorite count, etc.).
    """
    rec_count = db.query(Recommendation).filter(
        Recommendation.user_id == user_id
    ).count()
    
    favorite_count = db.query(FavoriteMeal).filter(
        FavoriteMeal.user_id == user_id
    ).count()
    
    top_recommendations = db.query(Recommendation.predicted_label).filter(
        Recommendation.user_id == user_id
    ).all()
    
    label_counts = {}
    for (label,) in top_recommendations:
        label_counts[label] = label_counts.get(label, 0) + 1
    
    return {
        "total_recommendations_generated": rec_count,
        "total_favorite_meals": favorite_count,
        "recommendations_by_label": label_counts,
        "user_id": user_id,
    }
