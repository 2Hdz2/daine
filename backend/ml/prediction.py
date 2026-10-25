"""Backend adapter around the project's existing ``daine_pipeline.py``."""
import importlib.util
import logging
from pathlib import Path
from typing import Dict

import pandas as pd

logger = logging.getLogger(__name__)

_pipeline_path = Path(__file__).resolve().parents[1] / "daine_pipeline.py"
_pipeline_spec = importlib.util.spec_from_file_location("daine_pipeline", _pipeline_path)
if _pipeline_spec is None or _pipeline_spec.loader is None:
    raise ImportError(f"Unable to load ML pipeline: {_pipeline_path}")

_pipeline = importlib.util.module_from_spec(_pipeline_spec)
_pipeline_spec.loader.exec_module(_pipeline)

# Keep one source of truth for the data schema, rules, training, scoring, and SHAP.
FEATURE_COLS = _pipeline.FEATURE_COLS
hard_rule_filter = _pipeline.hard_rule_filter
apply_rules = _pipeline.apply_rules
load_data = _pipeline.load_data
train_model = _pipeline.train_model
suitability_score = _pipeline.suitability_score
explain = _pipeline.explain
explain_batch = _pipeline.explain_batch


# ============================================================================
# 6. Complete Pipeline for a Single Item
# ============================================================================

def predict_single_item(
    df: pd.DataFrame,
    models: Dict,
    encoders: Dict,
    food_id: str,
    condition: str,
    model_type: str = "tree",
    include_explanation: bool = True,
) -> Dict:
    """
    Complete prediction pipeline for a single food item.
    
    Process:
    1. Retrieve food item
    2. Apply hard rule filter
    3. If blocked, return early with block reason
    4. Calculate suitability score using ML model
    5. Optionally generate SHAP explanation
    
    Args:
        df: Full food database
        models: Trained models dict (keyed by condition)
        encoders: Label encoders dict (keyed by condition)
        food_id: Food ID to evaluate
        condition: Dietary condition
        model_type: Model type used ("tree" or "xgboost")
        include_explanation: Whether to calculate SHAP contributions
        
    Returns:
        Dict with recommendation results
    """
    # Find the food item
    row = df[(df["food_id"] == food_id) & (df["condition"] == condition)]
    
    if row.empty:
        logger.warning(f"No entry for {food_id} / {condition}")
        return {
            "found": False,
            "error": f"No entry for {food_id} / {condition}",
        }
    
    row = row.iloc[0]

    nutrition_columns = {
        "carbs_g": "carbs_g",
        "protein_g": "protein_g",
        "fat_g": "fat_g",
        "saturated_fat_g": "saturated_fat_g",
        "fiber_g": "fiber_g",
        "sodium_mg": "sodium_mg",
        "calories": "calories",
    }
    nutritional_summary = {
        output_name: float(row[column])
        for output_name, column in nutrition_columns.items()
        if column in row and pd.notna(row[column])
    }
    meal_details = {
        "food_name_sinhala": row.get("sinhala_name"),
        "food_name_tamil": row.get("tamil_name"),
        "meal_type": row.get("meal_type"),
        "primary_ingredients": row.get("primary_ingredients"),
        "supporting_ingredients": row.get("supporting_ingredients"),
        "spices_seasonings": row.get("spices_seasonings"),
        "optional_ingredients": row.get("optional_ingredients"),
        "cooking_method": row.get("cooking_method"),
        "preparation_notes": row.get("preparation_notes"),
        "ingredients": row.get("ingredients"),
        "nutritional_summary": nutritional_summary,
    }

    def has_detail(value):
        if isinstance(value, (list, tuple, dict)):
            return bool(value)
        return value is not None and pd.notna(value) and bool(str(value).strip())

    meal_details = {
        key: value
        for key, value in meal_details.items()
        if key == "nutritional_summary"
        or has_detail(value)
    }

    # Apply hard rule filter first
    passed, reason = hard_rule_filter(row)
    
    if not passed:
        logger.info(f"BLOCKED by rule filter: {reason}")
        return {
            "found": True,
            "food_id": food_id,
            "food_name": row["food_name"],
            "condition": condition,
            "rule_pass": False,
            "rule_block_reason": reason,
            "predicted_label": None,
            "suitability_score": None,
            "class_probabilities": None,
            "shap_contributions": None,
            **meal_details,
        }
    
    # Item passed rules, send to ML model
    if condition not in models:
        logger.error(f"No model trained for condition: {condition}")
        return {
            "found": True,
            "food_id": food_id,
            "food_name": row["food_name"],
            "condition": condition,
            "error": f"No model trained for condition: {condition}",
        }
    
    # Prepare feature row for prediction
    feature_row = pd.DataFrame([row[FEATURE_COLS]])
    model = models[condition]
    encoder = encoders[condition]
    
    # Get suitability score
    score_result = suitability_score(model, encoder, feature_row)
    
    # Get SHAP explanation
    shap_contributions = None
    if include_explanation:
        shap_df = explain(model, feature_row, model_type)
        shap_contributions = shap_df.to_dict("records")
    
    return {
        "found": True,
        "food_id": food_id,
        "food_name": row["food_name"],
        "condition": condition,
        "rule_pass": True,
        "rule_block_reason": None,
        "predicted_label": score_result["predicted_label"],
        "suitability_score": score_result["suitability_score"],
        "class_probabilities": score_result["class_probabilities"],
        "shap_contributions": shap_contributions,
        **meal_details,
    }
