"""
Pydantic schemas for API request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


# ============================================================================
# User & Auth
# ============================================================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SignupResponse(TokenResponse):
    user: UserResponse


# ============================================================================
# User Profile
# ============================================================================

class UserProfileCreate(BaseModel):
    dietary_condition: str
    allergies: Optional[str] = None
    intolerances: Optional[str] = None
    disliked_foods: Optional[str] = None
    nutritional_goals: Optional[Dict[str, Any]] = None
    weight_objective: Optional[str] = None
    preferred_meal_structure: Optional[str] = None


class UserProfileResponse(UserProfileCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Inventory
# ============================================================================

class InventoryItemCreate(BaseModel):
    food_name: str
    quantity: float
    unit: str
    expiry_date: Optional[datetime] = None
    food_id: Optional[str] = None


class InventoryItemResponse(InventoryItemCreate):
    id: int
    user_id: int
    added_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class InventoryUpdateRequest(BaseModel):
    quantity: Optional[float] = None
    expiry_date: Optional[datetime] = None


# ============================================================================
# Food Database
# ============================================================================

class FoodResponse(BaseModel):
    food_id: str
    food_name: str
    condition: str
    suitability: str
    carbs_g: float
    protein_g: float
    fat_g: float
    saturated_fat_g: float
    fiber_g: float
    sodium_mg: float
    calories: float
    glycemic_index_tier: str
    portion_size: str
    
    class Config:
        from_attributes = True


# ============================================================================
# Recommendation
# ============================================================================

class SHAPContribution(BaseModel):
    feature: str
    value: float
    shap_contribution: float


class MealIngredientResponse(BaseModel):
    ingredient_id: str
    ingredient_name: str
    ingredient_role: Optional[str] = None
    essential: bool = False
    sinhala_name: Optional[str] = None
    tamil_name: Optional[str] = None
    aliases: Optional[str] = None


class RecommendationResponse(BaseModel):
    food_id: str
    food_name: str
    food_name_sinhala: Optional[str] = None
    food_name_tamil: Optional[str] = None
    condition: str
    rule_pass: bool
    rule_block_reason: Optional[str] = None
    predicted_label: Optional[str] = None
    suitability_score: Optional[float] = None
    class_probabilities: Optional[Dict[str, float]] = None
    shap_contributions: Optional[List[SHAPContribution]] = None
    available_ingredients: Optional[List[str]] = None
    missing_ingredients: Optional[List[str]] = None
    nutritional_summary: Optional[Dict[str, float]] = None
    explanation: Optional[str] = None
    meal_type: Optional[str] = None
    primary_ingredients: Optional[str] = None
    supporting_ingredients: Optional[str] = None
    spices_seasonings: Optional[str] = None
    optional_ingredients: Optional[str] = None
    cooking_method: Optional[str] = None
    preparation_notes: Optional[str] = None
    ingredients: Optional[List[MealIngredientResponse]] = None


class GenerateRecommendationRequest(BaseModel):
    food_id: str
    model_type: Optional[str] = "tree"  # tree or xgboost


class RecommendationsListResponse(BaseModel):
    total: int
    recommended: List[RecommendationResponse]
    moderate: List[RecommendationResponse]
    rejected: List[RecommendationResponse]
    model_type: str


# ============================================================================
# What-If Analysis
# ============================================================================

class WhatIfRequest(BaseModel):
    original_food_id: str
    modification: str  # Description of what's being changed
    modified_features: Optional[Dict[str, float]] = None  # Feature overrides


class WhatIfResponse(BaseModel):
    original: RecommendationResponse
    modified: RecommendationResponse
    score_change: float
    shap_changes: Optional[Dict[str, float]] = None
    explanation: Optional[str] = None


# ============================================================================
# Substitution
# ============================================================================

class SubstitutionRequest(BaseModel):
    original_food_id: str
    original_ingredient: str
    substitute_ingredient: str


class SubstitutionResponse(BaseModel):
    original_recommendation: RecommendationResponse
    substituted_recommendation: RecommendationResponse
    compatibility: float  # 0-1 score
    nutritional_changes: Dict[str, float]
    explanation: Optional[str] = None


# ============================================================================
# Recipes & Meals
# ============================================================================

class RecipeIngredientResponse(BaseModel):
    food_name: str
    quantity_needed: float
    unit: str
    is_optional: bool
    
    class Config:
        from_attributes = True


class RecipeResponse(BaseModel):
    recipe_id: str
    recipe_name: str
    description: Optional[str] = None
    preparation_time_minutes: Optional[int] = None
    difficulty: Optional[str] = None
    servings: Optional[int] = None
    ingredients: List[RecipeIngredientResponse]
    
    class Config:
        from_attributes = True


# ============================================================================
# Meal Planning
# ============================================================================

class PlannedMealCreate(BaseModel):
    meal_date: datetime
    meal_type: str  # breakfast, lunch, dinner, snack
    food_id: str
    food_name: str
    suitability_score: Optional[float] = None
    reason: Optional[str] = None


class PlannedMealResponse(PlannedMealCreate):
    id: int
    was_eaten: bool
    
    class Config:
        from_attributes = True


class MealPlanCreate(BaseModel):
    plan_type: str  # daily or weekly
    start_date: datetime
    end_date: datetime
    meals: Optional[List[PlannedMealCreate]] = []


class MealPlanResponse(BaseModel):
    id: int
    user_id: int
    plan_type: str
    start_date: datetime
    end_date: datetime
    meals: List[PlannedMealResponse]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Favorites
# ============================================================================

class FavoriteMealCreate(BaseModel):
    food_id: str
    food_name: str
    user_rating: Optional[int] = None
    notes: Optional[str] = None


class FavoriteMealResponse(FavoriteMealCreate):
    id: int
    user_id: int
    last_recommended: Optional[datetime] = None
    times_recommended: int
    added_at: datetime
    
    class Config:
        from_attributes = True
