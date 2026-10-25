"""
What-If / Counterfactual Analysis Service
Allows users to ask "what if" questions like:
- "What if I reduce the rice?"
- "What if I replace chicken?"
- "What if I add vegetables?"
"""
from typing import Dict, Optional
import pandas as pd
import logging
from config import settings
from ml.model_loader import ModelLoader
from ml.prediction import predict_single_item
from database.models import WhatIfAnalysis
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class WhatIfService:
    """Service for counterfactual/what-if analysis."""
    
    def __init__(self):
        self.model_loader = ModelLoader()
    
    def analyze_what_if(
        self,
        food_id: str,
        condition: str,
        modified_features: Dict[str, float],
        description: str,
        model_type: str = "tree",
    ) -> Dict:
        """
        Perform what-if analysis by modifying food features and re-evaluating.
        
        Process:
        1. Get original recommendation
        2. Modify specified features
        3. Re-evaluate with modified features
        4. Compare results and calculate impact
        
        Args:
            food_id: Original food ID
            condition: Dietary condition
            modified_features: Dict of features to override (e.g., {"sodium_mg": 400})
            description: Description of the modification (e.g., "reduce rice by 50%")
            model_type: Model type ("tree" or "xgboost")
            
        Returns:
            Dict comparing original vs modified recommendation
        """
        try:
            models, encoders, data = self.model_loader.load_models(
                settings.data_path,
                model_type=model_type,
            )
            
            # Get original food row
            original_row = data[(data["food_id"] == food_id) & (data["condition"] == condition)]
            
            if original_row.empty:
                return {
                    "error": f"Food not found: {food_id} / {condition}",
                }
            
            original_row = original_row.iloc[0]
            
            # Get original prediction
            original_pred = predict_single_item(
                data,
                models,
                encoders,
                food_id,
                condition,
                model_type,
            )
            
            # Create modified row by copying original and updating specified features
            modified_row = original_row.copy()
            for feature, value in modified_features.items():
                if feature in modified_row.index:
                    modified_row[feature] = value
                else:
                    logger.warning(f"Feature {feature} not found in data")
            
            # Get modified features as DataFrame for prediction
            from ml.prediction import hard_rule_filter, suitability_score, explain, FEATURE_COLS
            
            # Check if modified row still passes rules
            passed, block_reason = hard_rule_filter(modified_row)
            
            if not passed:
                modified_pred = {
                    "food_id": food_id,
                    "food_name": original_row["food_name"],
                    "condition": condition,
                    "rule_pass": False,
                    "rule_block_reason": block_reason,
                    "predicted_label": None,
                    "suitability_score": None,
                    "class_probabilities": None,
                    "shap_contributions": None,
                }
            else:
                # Prepare modified feature row for prediction
                modified_feature_row = pd.DataFrame([modified_row[FEATURE_COLS]])
                model = models[condition]
                encoder = encoders[condition]
                
                # Get suitability score
                score_result = suitability_score(model, encoder, modified_feature_row)
                
                # Get SHAP explanation
                shap_df = explain(model, modified_feature_row, model_type)
                shap_contributions = shap_df.to_dict("records")
                
                modified_pred = {
                    "food_id": food_id,
                    "food_name": original_row["food_name"],
                    "condition": condition,
                    "rule_pass": True,
                    "rule_block_reason": None,
                    "predicted_label": score_result["predicted_label"],
                    "suitability_score": score_result["suitability_score"],
                    "class_probabilities": score_result["class_probabilities"],
                    "shap_contributions": shap_contributions,
                }
            
            # Calculate score change
            original_score = original_pred.get("suitability_score", 0)
            modified_score = modified_pred.get("suitability_score", 0)
            score_change = modified_score - original_score if original_score is not None else None
            
            # Calculate SHAP changes
            shap_changes = self._calculate_shap_changes(original_pred, modified_pred)
            
            return {
                "description": description,
                "modification": modified_features,
                "original": original_pred,
                "modified": modified_pred,
                "score_change": score_change,
                "shap_changes": shap_changes,
                "improvement": score_change > 0 if score_change is not None else None,
            }
        
        except Exception as e:
            logger.error(f"Error in what-if analysis: {str(e)}", exc_info=True)
            raise
    
    def _calculate_shap_changes(self, original: Dict, modified: Dict) -> Optional[Dict[str, float]]:
        """Calculate which SHAP contributions changed between original and modified."""
        if (not original.get("shap_contributions") or 
            not modified.get("shap_contributions")):
            return None
        
        original_shap = {item["feature"]: item["shap_contribution"] 
                        for item in original["shap_contributions"]}
        modified_shap = {item["feature"]: item["shap_contribution"] 
                        for item in modified["shap_contributions"]}
        
        changes = {}
        for feature in original_shap:
            if feature in modified_shap:
                change = modified_shap[feature] - original_shap[feature]
                if change != 0:
                    changes[feature] = change
        
        return changes if changes else None
    
    def save_analysis(
        self,
        db: Session,
        user_id: int,
        analysis_result: Dict,
    ) -> WhatIfAnalysis:
        """Save what-if analysis to database for tracking."""
        try:
            record = WhatIfAnalysis(
                user_id=user_id,
                original_food_id=analysis_result["original"].get("food_id"),
                original_score=analysis_result["original"].get("suitability_score"),
                original_shap=str(analysis_result["original"].get("shap_contributions")),
                modified_food_id=analysis_result["modified"].get("food_id"),
                modified_score=analysis_result["modified"].get("suitability_score"),
                modified_shap=str(analysis_result["modified"].get("shap_contributions")),
                modification_description=analysis_result.get("description"),
            )
            
            db.add(record)
            db.commit()
            db.refresh(record)
            
            logger.info(f"What-if analysis saved for user {user_id}")
            return record
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving what-if analysis: {str(e)}")
            raise


def get_what_if_service() -> WhatIfService:
    """Dependency for getting what-if service."""
    return WhatIfService()
