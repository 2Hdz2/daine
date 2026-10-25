# DAINE Backend API

Explainable AI Dietary Decision-Support System - Backend API

## Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL 12+
- pip/venv

### Installation

1. **Create virtual environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings, especially:
# - DATABASE_URL: PostgreSQL connection string
# - SECRET_KEY: Change to a secure random string
```

4. **Initialize database**
```bash
# The database will be auto-initialized on first run, or manually:
python -c "from database import init_db; init_db()"
```

5. **Run application**
```bash
python main.py
```

API will be available at `http://localhost:8000`

## API Documentation

### Interactive Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Architecture

### Core Layers

**1. API Layer** (`api/`)
- HTTP endpoints for all features
- Request/response validation
- Authentication & authorization

**2. Service Layer** (`services/`)
- Business logic
- ML integration
- External service calls

**3. ML Layer** (`ml/`)
- Recommendation pipeline using `backend/daine_pipeline.py`
- Model loading & caching
- Feature engineering
- SHAP explanations

**4. Database Layer** (`database/`)
- SQLAlchemy ORM models
- Pydantic schemas
- DB initialization

### Key Services

- **RecommendationService**: Generates food suitability recommendations
- **WhatIfService**: Counterfactual analysis
- **SubstitutionService**: Ingredient substitutions
- **InventoryService**: Household food management
- **MealPlanningService**: Daily/weekly meal plans
- **UserService**: User & profile management

## API Endpoints

### Authentication
```
POST   /api/auth/signup           - Create account
POST   /api/auth/login            - Login (returns JWT)
GET    /api/auth/me               - Get current user
```

### User Profile
```
POST   /api/profile               - Create profile
GET    /api/profile               - Get profile
PUT    /api/profile               - Update profile
```

### Inventory
```
POST   /api/inventory             - Add food item
GET    /api/inventory             - List inventory
GET    /api/inventory/summary     - Get summary
PUT    /api/inventory/{id}        - Update item
DELETE /api/inventory/{id}        - Remove item
```

### Recommendations
```
POST   /api/recommendations/single       - Single recommendation
GET    /api/recommendations/all          - All recommendations
GET    /api/recommendations/history      - Recommendation history
```

### What-If Analysis
```
POST   /api/what-if/analyze      - Perform what-if analysis
GET    /api/what-if/history      - Analysis history
```

### Substitutions
```
GET    /api/substitutions/find/{ingredient}   - Find substitutes
POST   /api/substitutions/evaluate              - Evaluate substitution
```

### Meal Planning
```
POST   /api/meal-plans                    - Create plan
GET    /api/meal-plans                    - List plans
GET    /api/meal-plans/{id}               - Get specific plan
POST   /api/meal-plans/generate-daily     - Generate daily plan
POST   /api/meal-plans/generate-weekly    - Generate weekly plan
POST   /api/meal-plans/{id}/meals         - Add meal to plan
PATCH  /api/meal-plans/meals/{id}/eat     - Mark meal eaten
```

### Favorites & History
```
POST   /api/favorites                     - Add favorite
GET    /api/favorites                     - List favorites
PUT    /api/favorites/{id}                - Update favorite
DELETE /api/favorites/{id}                - Remove favorite
GET    /api/history/recommendations       - Get history
GET    /api/history/stats                 - Get stats
```

## Recommendation Pipeline

The system implements a 3-stage pipeline:

### 1. Hard Safety Rules (Non-negotiable)
- Diabetes: Block high-GI + high-carb combinations
- Hypertension: Block high-sodium foods
- Cardiovascular: Block high saturated fat
- Weight Management: Block excessive calories

**Important**: Rules are applied BEFORE ML, never overridden by it.

### 2. Machine Learning (Decision Tree or XGBoost)
- Trained per dietary condition
- Predicts: recommended / moderate / not_recommended
- Only evaluates items that passed rule filter

### 3. Explainability (SHAP)
- Feature importance (SHAP values)
- Ranked by contribution
- Integrated into all recommendations

## What-If Analysis

Users can ask "what if" questions:
- "What if I reduce sodium?"
- "What if I use a substitute ingredient?"
- "What if I change portion size?"

The service:
1. Modifies specified features
2. Re-runs the complete pipeline
3. Compares original vs modified
4. Shows impact on suitability score

## Substitution Engine

Finds ingredient alternatives based on:
- Nutritional similarity
- ML compatibility score
- Safety (doesn't violate rules)

Returns top 5 substitutes ranked by overall compatibility.

## Meal Planning

Creates personalized meal plans:
- Considers user's dietary condition
- Uses available household inventory
- Applies ML suitability recommendations
- Can mark meals as eaten (history tracking)

## Security

- **Authentication**: JWT tokens (HS256)
- **Password Hashing**: bcrypt
- **Rate Limiting**: 100 requests/minute per user
- **Input Validation**: Type and content checks
- **User Isolation**: Each user only sees their own data

## Database Schema

### Users
- User accounts and authentication
- Dietary profiles with conditions/allergies
- Preferences and goals

### Inventory
- User's household food items
- Quantities and expiry dates
- Used for meal planning

### Recommendations
- History of all recommendations
- Scores, predictions, SHAP explanations
- Tracking user interactions

### Meal Plans
- Daily/weekly plan definitions
- Planned meals with explanations
- Eaten/skipped tracking

### Favorites
- User's favorite meals
- Ratings and notes

### Analysis History
- What-if analysis results
- Before/after comparisons

## Development

### Running Tests
```bash
pytest
```

### Logging
```python
import logging
logger = logging.getLogger(__name__)
logger.info("message")
```

### Database Migrations
```bash
# Auto-create tables on startup
# For advanced migrations, use Alembic:
alembic init migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Performance

### Model Caching
- Models are loaded once and cached
- Reused across all recommendations
- Prevents expensive retraining per request

### Database Optimization
- Indexes on user_id, food_id, condition
- Query optimization with proper joins
- Connection pooling

## Error Handling

All endpoints return structured error responses:

```json
{
  "detail": "Error message",
  "status_code": 400,
  "error_type": "ValueError"
}
```

## Deployment

See `docker-compose.yml` and Phase 12 for containerization and deployment.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection
- `SECRET_KEY`: JWT signing key
- `ML_MODEL_TYPE`: tree or xgboost
- `DATA_PATH`: Path to food database

## Contributing

Maintain separation of concerns:
- API layer: HTTP handling only
- Service layer: Business logic
- ML layer: ML pipeline isolation
- Database layer: Persistence

Keep the original `backend/daine_pipeline.py` logic intact, using service wrappers around it.
