"""
SQLAlchemy ORM models for DAINE application.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class User(Base):
    """User account."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    inventory = relationship("InventoryItem", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    meal_plans = relationship("MealPlan", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("FavoriteMeal", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    """User dietary profile and preferences."""
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    dietary_condition = Column(String(50), index=True)  # diabetes, hypertension, cardiovascular, etc.
    allergies = Column(Text)  # comma-separated or JSON
    intolerances = Column(Text)  # comma-separated or JSON
    disliked_foods = Column(Text)  # comma-separated or JSON
    nutritional_goals = Column(Text)  # JSON: protein_target, calorie_target, etc.
    weight_objective = Column(String(20))  # weight_loss, weight_gain, maintain
    preferred_meal_structure = Column(String(100))  # e.g., 3_meals_2_snacks
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="profile")


class InventoryItem(Base):
    """Household food/ingredient inventory."""
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    food_id = Column(String(50), index=True)  # Reference to FoodHealth_DB if available
    food_name = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50))  # grams, ml, pieces, etc.
    expiry_date = Column(DateTime)  # When the food expires
    added_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="inventory")


class Food(Base):
    """Food/ingredient master database (cached from FoodHealth_DB)."""
    __tablename__ = "foods"
    
    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(String(50), unique=True, index=True)
    food_name = Column(String(255), nullable=False)
    condition = Column(String(50), index=True)  # Which dietary condition this is for
    suitability = Column(String(20))  # recommended, moderate, not_recommended
    carbs_g = Column(Float)
    protein_g = Column(Float)
    fat_g = Column(Float)
    saturated_fat_g = Column(Float)
    fiber_g = Column(Float)
    sodium_mg = Column(Float)
    calories = Column(Float)
    glycemic_index_tier = Column(String(20))  # low, moderate, high
    key_nutritional_factor = Column(String(255))
    portion_size = Column(String(100))
    reasoning_tag = Column(String(100))
    reasoning = Column(Text)
    gi_score = Column(Integer)  # 0=low, 1=moderate, 2=high
    created_at = Column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    """Recommendation history and results."""
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    food_id = Column(String(50), index=True)
    food_name = Column(String(255))
    condition = Column(String(50))
    rule_pass = Column(Boolean)  # Did it pass hard rule filter?
    rule_block_reason = Column(Text)  # Why it was blocked (if applicable)
    predicted_label = Column(String(20))  # recommended, moderate, not_recommended
    suitability_score = Column(Float)  # 0-100
    class_probabilities = Column(Text)  # JSON: {label: probability}
    shap_explanation = Column(Text)  # JSON: SHAP contributions
    model_type = Column(String(20))  # tree or xgboost
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="recommendations")


class Recipe(Base):
    """Recipe/meal definitions."""
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(String(50), unique=True, index=True)
    recipe_name = Column(String(255), nullable=False)
    description = Column(Text)
    preparation_time_minutes = Column(Integer)
    difficulty = Column(String(20))  # easy, medium, hard
    servings = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")


class RecipeIngredient(Base):
    """Ingredients in a recipe."""
    __tablename__ = "recipe_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    food_id = Column(String(50))
    food_name = Column(String(255), nullable=False)
    quantity_needed = Column(Float)
    unit = Column(String(50))
    is_optional = Column(Boolean, default=False)
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")


class MealPlan(Base):
    """Daily or weekly meal plan."""
    __tablename__ = "meal_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    plan_type = Column(String(20))  # daily or weekly
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="meal_plans")
    meals = relationship("PlannedMeal", back_populates="meal_plan", cascade="all, delete-orphan")


class PlannedMeal(Base):
    """A meal slot in a meal plan."""
    __tablename__ = "planned_meals"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id"), nullable=False)
    meal_date = Column(DateTime, nullable=False)
    meal_type = Column(String(20))  # breakfast, lunch, dinner, snack
    food_id = Column(String(50))
    food_name = Column(String(255))
    suitability_score = Column(Float)
    reason = Column(Text)  # Why this meal was recommended
    was_eaten = Column(Boolean, default=False)
    
    # Relationships
    meal_plan = relationship("MealPlan", back_populates="meals")


class FavoriteMeal(Base):
    """User's favorite meals."""
    __tablename__ = "favorite_meals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    food_id = Column(String(50), index=True)
    food_name = Column(String(255))
    last_recommended = Column(DateTime)
    times_recommended = Column(Integer, default=0)
    user_rating = Column(Integer)  # 1-5 stars
    notes = Column(Text)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="favorites")


class WhatIfAnalysis(Base):
    """Counterfactual/what-if analysis history."""
    __tablename__ = "what_if_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_food_id = Column(String(50))
    original_score = Column(Float)
    original_shap = Column(Text)  # JSON
    modified_food_id = Column(String(50))
    modified_score = Column(Float)
    modified_shap = Column(Text)  # JSON
    modification_description = Column(Text)  # What was changed
    created_at = Column(DateTime, default=datetime.utcnow)
