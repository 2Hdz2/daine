"""
Ingredient Substitution Service
Evaluates ingredient substitutions using the ML pipeline.
"""
from typing import Dict, Optional, List
import pandas as pd
import logging
from config import settings
from ml.model_loader import ModelLoader
from ml.prediction import predict_single_item

logger = logging.getLogger(__name__)


class SubstitutionService:
    """Service for evaluating ingredient substitutions."""
    
    def __init__(self):
        self.model_loader = ModelLoader()
    
    def find_substitutes(
        self,
        ingredient_name: str,
        condition: str,
        model_type: str = "tree",
    ) -> List[Dict]:
        """
        Find compatible substitute ingredients for a given ingredient.
        
        Uses nutritional similarity and ML compatibility to identify alternatives.
        
        Args:
            ingredient_name: Original ingredient
            condition: Dietary condition
            model_type: ML model type
            
        Returns:
            List of substitute options with compatibility info
        """
        try:
            models, encoders, data = self.model_loader.load_models(
                settings.data_path,
                model_type=model_type,
            )
            
            # Find foods matching ingredient name
            similar_foods = data[data["condition"] == condition].copy()
            
            if similar_foods.empty:
                return []
            
            # Find original ingredient
            original = similar_foods[
                similar_foods["food_name"].str.contains(ingredient_name, case=False, na=False)
            ]
            
            if original.empty:
                logger.warning(f"Ingredient not found: {ingredient_name}")
                return []
            
            original = original.iloc[0]
            original_carbs = original.get("carbs_g", 0)
            original_protein = original.get("protein_g", 0)
            original_fat = original.get("fat_g", 0)
            
            # Score all other foods as potential substitutes
            substitutes = []
            for _, food in similar_foods.iterrows():
                if food["food_id"] == original["food_id"]:
                    continue
                
                # Calculate nutritional similarity
                similarity = self._calculate_nutritional_similarity(
                    original_carbs, original_protein, original_fat,
                    food.get("carbs_g", 0), food.get("protein_g", 0), food.get("fat_g", 0),
                )
                
                # Get ML compatibility score
                pred = predict_single_item(
                    data, models, encoders,
                    food["food_id"], condition, model_type,
                )
                
                if pred.get("found"):
                    compatibility = {
                        "original_food": original["food_name"],
                        "substitute_food": food["food_name"],
                        "substitute_food_id": food["food_id"],
                        "nutritional_similarity": similarity,
                        "ml_suitability_score": pred.get("suitability_score", 0),
                        "ml_prediction": pred.get("predicted_label"),
                        "blocked": not pred.get("rule_pass"),
                        "block_reason": pred.get("rule_block_reason"),
                        "overall_compatibility": (
                            (similarity * 0.3 + (pred.get("suitability_score", 0) / 100) * 0.7)
                            if not pred.get("rule_block_reason") else 0
                        ),
                    }
                    substitutes.append(compatibility)
            
            # Sort by overall compatibility
            substitutes.sort(key=lambda x: x["overall_compatibility"], reverse=True)
            
            return substitutes[:5]  # Return top 5
        
        except Exception as e:
            logger.error(f"Error finding substitutes: {str(e)}", exc_info=True)
            raise
    
    def evaluate_substitution(
        self,
        original_food_id: str,
        substitute_food_id: str,
        condition: str,
        model_type: str = "tree",
    ) -> Dict:
        """
        Evaluate how a substitution affects the recommendation.
        
        Args:
            original_food_id: Original food
            substitute_food_id: Proposed substitute
            condition: Dietary condition
            model_type: ML model type
            
        Returns:
            Detailed comparison of original vs substituted
        """
        try:
            models, encoders, data = self.model_loader.load_models(
                settings.data_path,
                model_type=model_type,
            )
            
            # Get predictions for both
            original_pred = predict_single_item(
                data, models, encoders,
                original_food_id, condition, model_type,
            )
            
            substitute_pred = predict_single_item(
                data, models, encoders,
                substitute_food_id, condition, model_type,
            )
            
            if not original_pred.get("found") or not substitute_pred.get("found"):
                return {"error": "Food not found"}
            
            # Calculate nutritional changes
            original_row = data[data["food_id"] == original_food_id].iloc[0]
            substitute_row = data[data["food_id"] == substitute_food_id].iloc[0]
            
            nutritional_changes = {
                "carbs_g": substitute_row.get("carbs_g", 0) - original_row.get("carbs_g", 0),
                "protein_g": substitute_row.get("protein_g", 0) - original_row.get("protein_g", 0),
                "fat_g": substitute_row.get("fat_g", 0) - original_row.get("fat_g", 0),
                "sodium_mg": substitute_row.get("sodium_mg", 0) - original_row.get("sodium_mg", 0),
                "calories": substitute_row.get("calories", 0) - original_row.get("calories", 0),
            }
            
            # Calculate compatibility
            original_score = original_pred.get("suitability_score", 0)
            substitute_score = substitute_pred.get("suitability_score", 0)
            score_diff = substitute_score - original_score
            
            compatibility = 1.0 if score_diff >= 0 else max(0, 1.0 + (score_diff / 100))
            
            return {
                "original_food": original_pred["food_name"],
                "original_score": original_score,
                "original_blocked": not original_pred.get("rule_pass"),
                "substitute_food": substitute_pred["food_name"],
                "substitute_score": substitute_score,
                "substitute_blocked": not substitute_pred.get("rule_pass"),
                "block_reason": substitute_pred.get("rule_block_reason"),
                "score_change": score_diff,
                "compatibility": compatibility,
                "nutritional_changes": nutritional_changes,
                "recommendation": self._generate_substitution_recommendation(
                    original_pred, substitute_pred, nutritional_changes,
                ),
            }
        
        except Exception as e:
            logger.error(f"Error evaluating substitution: {str(e)}", exc_info=True)
            raise
    
    def _calculate_nutritional_similarity(
        self,
        orig_carbs: float,
        orig_protein: float,
        orig_fat: float,
        sub_carbs: float,
        sub_protein: float,
        sub_fat: float,
    ) -> float:
        """
        Calculate nutritional similarity between two foods (0-1 scale).
        Uses L2 distance normalized.
        """
        import math
        
        distance = math.sqrt(
            (orig_carbs - sub_carbs) ** 2 +
            (orig_protein - sub_protein) ** 2 +
            (orig_fat - sub_fat) ** 2
        )
        
        # Normalize: assume max difference of 50g per macronutrient
        max_distance = math.sqrt(3 * (50 ** 2))
        similarity = max(0, 1.0 - (distance / max_distance))
        
        return round(similarity, 2)
    
    def _generate_substitution_recommendation(
        self,
        original: Dict,
        substitute: Dict,
        nutritional_changes: Dict,
    ) -> str:
        """Generate human-readable substitution recommendation."""
        if substitute.get("rule_block_reason"):
            return f"❌ Not recommended: {substitute.get('rule_block_reason')}"
        
        score_change = (substitute.get("suitability_score", 0) - 
                       original.get("suitability_score", 0))
        
        if score_change > 10:
            return "✅ Highly recommended - improves suitability"
        elif score_change > 0:
            return "✅ Recommended - slight improvement"
        elif score_change > -10:
            return "⚠️ Neutral - minimal impact"
        else:
            return "❌ Not recommended - reduces suitability"


def get_substitution_service() -> SubstitutionService:
    """Dependency for getting substitution service."""
    return SubstitutionService()
