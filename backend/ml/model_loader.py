"""
Model Loading and Caching Service
Loads trained models once and reuses them to avoid retraining on each request.
"""
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Tuple, Optional
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
import logging

logger = logging.getLogger(__name__)


class ModelLoader:
    """Singleton for loading and caching trained ML models."""
    
    _instance = None
    _models = {}
    _encoders = {}
    _data = None
    _models_trained_type = None
    
    def __new__(cls):
        """Ensure singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @classmethod
    def load_models(
        cls,
        data_path: str,
        model_type: str = "tree",
    ) -> Tuple[Dict, Dict, pd.DataFrame]:
        """
        Load or retrieve cached trained models.
        
        Args:
            data_path: Path to food_db.xlsx
            model_type: "tree" for Decision Tree or "xgboost" for XGBoost
            
        Returns:
            (models_dict, encoders_dict, dataframe)
        """
        instance = cls()
        
        # Return cached models if available and correct type
        if (instance._models and 
            instance._encoders and 
            instance._data is not None and
            instance._models_trained_type == model_type):
            logger.info(f"Using cached models ({model_type})")
            return instance._models, instance._encoders, instance._data
        
        # Load and train models
        logger.info(f"Loading and training models ({model_type})...")
        from .prediction import train_model, load_data, apply_rules
        
        data = load_data(data_path)
        meal_prep_data = pd.read_excel(data_path, sheet_name="FoodMealPrep_DB")
        meal_prep_ingredients = pd.read_excel(
            data_path,
            sheet_name="FoodMealPrep_Ingredients",
        )
        ingredient_master = pd.read_excel(
            data_path,
            sheet_name="FoodMealPrep_IngredientMaster",
        )

        ingredient_details = meal_prep_ingredients.merge(
            ingredient_master[
                ["ingredient_id", "sinhala_name", "tamil_name", "aliases"]
            ],
            on="ingredient_id",
            how="left",
            validate="many_to_one",
        )
        ingredient_details[
            ["ingredient_role", "sinhala_name", "tamil_name", "aliases"]
        ] = ingredient_details[
            ["ingredient_role", "sinhala_name", "tamil_name", "aliases"]
        ].fillna("")
        ingredient_details["essential"] = (
            ingredient_details["essential"].astype(str).str.strip().str.lower() == "yes"
        )
        ingredients_by_food = (
            ingredient_details.groupby("food_id", sort=False)
            .apply(
                lambda group: group[
                    [
                        "ingredient_id",
                        "ingredient_name",
                        "ingredient_role",
                        "essential",
                        "sinhala_name",
                        "tamil_name",
                        "aliases",
                    ]
                ].to_dict("records")
            )
            .to_dict()
        )

        meal_prep_data = meal_prep_data[
            [
                "food_id",
                "sinhala_name",
                "tamil_name",
                "meal_type",
                "primary_ingredients",
                "supporting_ingredients",
                "spices_seasonings",
                "optional_ingredients",
                "cooking_method",
                "preparation_notes",
            ]
        ].copy()
        meal_prep_data["ingredients"] = meal_prep_data["food_id"].map(
            ingredients_by_food
        )
        data = data.merge(
            meal_prep_data,
            on="food_id",
            how="left",
            validate="many_to_one",
        )
        data = apply_rules(data)
        models, encoders = train_model(data, model_type=model_type)
        
        # Cache
        instance._models = models
        instance._encoders = encoders
        instance._data = data
        instance._models_trained_type = model_type
        
        logger.info(f"Models ({model_type}) loaded and cached successfully")
        return models, encoders, data
    
    @classmethod
    def get_models(cls) -> Optional[Dict]:
        """Get cached models if available."""
        instance = cls()
        return instance._models if instance._models else None
    
    @classmethod
    def get_encoders(cls) -> Optional[Dict]:
        """Get cached encoders if available."""
        instance = cls()
        return instance._encoders if instance._encoders else None
    
    @classmethod
    def get_data(cls) -> Optional[pd.DataFrame]:
        """Get cached data if available."""
        instance = cls()
        return instance._data
    
    @classmethod
    def clear_cache(cls):
        """Clear cached models (useful for testing)."""
        instance = cls()
        instance._models = {}
        instance._encoders = {}
        instance._data = None
        instance._models_trained_type = None
        logger.info("Model cache cleared")


def get_model_loader() -> ModelLoader:
    """Dependency for getting ModelLoader singleton."""
    return ModelLoader()
