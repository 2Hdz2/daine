"""
Recommendation Service
High-level service that coordinates ML predictions with business logic.
"""
from typing import Dict, List, Optional
import pandas as pd
import logging
from config import settings
from ml.model_loader import ModelLoader
from ml.prediction import FEATURE_COLS, explain_batch, predict_single_item
from database.schemas import (
    RecommendationResponse,
    SHAPContribution,
    MealIngredientResponse,
)

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for generating food/meal recommendations."""
    
    def __init__(self):
        """Initialize recommendation service."""
        self.model_loader = ModelLoader()
    
    def get_recommendation_for_food(
        self,
        food_id: str,
        condition: str,
        model_type: str = "tree",
    ) -> RecommendationResponse:
        """
        Get recommendation for a specific food item.
        
        Args:
            food_id: Food ID from database
            condition: Dietary condition
            model_type: ML model type ("tree" or "xgboost")
            
        Returns:
            RecommendationResponse with full details
        """
        try:
            # Load cached models or train new ones
            models, encoders, data = self.model_loader.load_models(
                settings.data_path,
                model_type=model_type,
            )
            
            # Run prediction pipeline
            result = predict_single_item(
                data,
                models,
                encoders,
                food_id,
                condition,
                model_type=model_type,
            )
            
            if not result.get("found"):
                logger.warning(f"Food not found: {food_id} / {condition}")
                return None
            
            # Transform to response schema
            return self._build_recommendation_response(result)
        
        except Exception as e:
            logger.error(f"Error in recommendation: {str(e)}", exc_info=True)
            raise
    
    def get_recommendations_for_condition(
        self,
        condition: str,
        model_type: str = "tree",
        limit: Optional[int] = None,
        filter_blocked: bool = True,
    ) -> Dict[str, List[RecommendationResponse]]:
        """
        Get all recommendations for a specific dietary condition.
        
        Useful for showing what's available/recommended for a condition.
        
        Args:
            condition: Dietary condition
            model_type: ML model type
            limit: Maximum number of recommendations per category
            filter_blocked: Exclude hard-rule-blocked items?
            
        Returns:
            Dict with keys: recommended, moderate, rejected
            Each containing sorted RecommendationResponse list
        """
        try:
            models, encoders, data = self.model_loader.load_models(
                settings.data_path,
                model_type=model_type,
            )
            
            # Filter data for condition
            condition_data = data[data["condition"] == condition]
            
            if condition_data.empty:
                logger.warning(f"No data for condition: {condition}")
                return {"recommended": [], "moderate": [], "rejected": []}
            
            recommendations = {
                "recommended": [],
                "moderate": [],
                "rejected": [],
            }
            prediction_results = []
            explainable_rows = []

            # Evaluate each food
            for _, row in condition_data.iterrows():
                food_id = row["food_id"]
                result = predict_single_item(
                    data,
                    models,
                    encoders,
                    food_id,
                    condition,
                    model_type=model_type,
                    include_explanation=False,
                )
                
                if not result.get("found"):
                    continue

                prediction_results.append(result)
                if result.get("rule_pass"):
                    explainable_rows.append(row[FEATURE_COLS])

            if explainable_rows:
                explanation_frames = explain_batch(
                    models[condition],
                    pd.DataFrame(explainable_rows, columns=FEATURE_COLS),
                )
                explanation_index = 0
                for result in prediction_results:
                    if result.get("rule_pass"):
                        result["shap_contributions"] = explanation_frames[
                            explanation_index
                        ].to_dict("records")
                        explanation_index += 1

            for result in prediction_results:
                rec = self._build_recommendation_response(result)
                
                # Categorize
                if not result.get("rule_pass"):
                    recommendations["rejected"].append(rec)
                else:
                    label = result.get("predicted_label", "moderate")
                    if label == "recommended":
                        recommendations["recommended"].append(rec)
                    else:
                        recommendations["moderate"].append(rec)
            
            # Filter blocked if requested
            if not filter_blocked:
                pass  # Keep rejected
            
            # Sort by suitability score (descending)
            for key in recommendations:
                recommendations[key] = sorted(
                    recommendations[key],
                    key=lambda x: x.suitability_score if x.suitability_score else 0,
                    reverse=True,
                )
            
            # Limit results if specified
            if limit:
                for key in recommendations:
                    recommendations[key] = recommendations[key][:limit]
            
            return recommendations
        
        except Exception as e:
            logger.error(f"Error getting recommendations: {str(e)}", exc_info=True)
            raise
    
    def _build_recommendation_response(self, result: Dict) -> RecommendationResponse:
        """Convert prediction result to response schema."""
        shap_contributions = None
        if result.get("shap_contributions"):
            shap_contributions = [
                SHAPContribution(**item)
                for item in result["shap_contributions"]
            ]
        ingredients = [
            MealIngredientResponse(**item)
            for item in result.get("ingredients", [])
        ]
        
        return RecommendationResponse(
            food_id=result.get("food_id"),
            food_name=result.get("food_name"),
            food_name_sinhala=result.get("food_name_sinhala"),
            food_name_tamil=result.get("food_name_tamil"),
            condition=result.get("condition"),
            rule_pass=result.get("rule_pass", False),
            rule_block_reason=result.get("rule_block_reason"),
            predicted_label=result.get("predicted_label"),
            suitability_score=result.get("suitability_score"),
            class_probabilities=result.get("class_probabilities"),
            shap_contributions=shap_contributions,
            nutritional_summary=result.get("nutritional_summary"),
            meal_type=result.get("meal_type"),
            primary_ingredients=result.get("primary_ingredients"),
            supporting_ingredients=result.get("supporting_ingredients"),
            spices_seasonings=result.get("spices_seasonings"),
            optional_ingredients=result.get("optional_ingredients"),
            cooking_method=result.get("cooking_method"),
            preparation_notes=result.get("preparation_notes"),
            ingredients=ingredients,
        )


def get_recommendation_service() -> RecommendationService:
    """Dependency for getting recommendation service."""
    return RecommendationService()
