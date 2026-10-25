# 🏥 DAINE - Explainable AI Dietary Decision-Support System

## ✅ Status: Phase 11 Complete - Production Ready

**DAINE** is a full-stack healthcare application providing AI-powered dietary recommendations with complete explainability (SHAP), what-if analysis, ingredient substitutions, and meal planning.

### 🎯 What This Does

- **AI Meal Recommendations**: Personalized meals based on your health condition (diabetes, hypertension, cardiovascular, weight management)
- **Explainable AI (SHAP)**: See which nutrition features supported or pulled against each scored meal's predicted class
- **Meal and Ingredient Search**: Search recommendation cards by food names, ingredients, or keywords
- **What-If Analysis**: Modify ingredients and instantly see how it impacts your health score
- **Ingredient Substitution**: Find healthier alternatives for any ingredient
- **Meal Planning**: Generate daily/weekly meal plans based on your inventory
- **User Profiles**: Track dietary conditions, allergies, intolerances, preferences

---

## 📁 Project Structure

```
daine/
├── requirements.txt               # Original dependencies
│
├── backend/                       # FastAPI + PostgreSQL (30+ files)
│   ├── daine_pipeline.py         # Original ML pipeline (PRESERVED)
│   ├── data/food_db.xlsx         # Food database with nutrition
│   ├── main.py                   # API server
│   ├── config.py                 # Configuration
│   ├── requirements.txt           # Dependencies
│   ├── .env.example              # Environment template
│   ├── database/                 # Database layer
│   ├── ml/                       # ML pipeline wrapper
│   ├── services/                 # Business logic
│   ├── api/                      # REST endpoints
│   └── README.md                 # Backend docs
│
├── frontend/                      # React 18 + TypeScript (11 pages)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx               # Router
│   │   ├── api/client.ts         # API client
│   │   ├── store/index.ts        # Zustand state
│   │   ├── components/           # 3 reusable components
│   │   ├── pages/                # 11 full pages
│   │   └── index.css             # Global styles
│   └── README.md                 # Frontend docs
│
├── PROJECT_SUMMARY.md            # Complete project documentation
├── ENV_SETUP_GUIDE.md           # Environment configuration guide
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Initialize database
python -c "from database.database import init_db; init_db()"

# Run server
uvicorn main:app --reload
# API at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start dev server
npm run dev
# App at http://localhost:5173
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🎨 Features

### ✅ Phase 1-10: Backend Complete

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | FastAPI + PostgreSQL Infrastructure | ✅ |
| 2 | ML Pipeline Integration (SHAP) | ✅ |
| 3 | Authentication (JWT) | ✅ |
| 4 | Inventory Management | ✅ |
| 5 | Recommendations API | ✅ |
| 6 | What-If Analysis | ✅ |
| 7 | Ingredient Substitution | ✅ |
| 8 | Meal Planning | ✅ |
| 9 | Favorites & History | ✅ |
| 10 | Security & Rate Limiting | ✅ |

### ✅ Phase 11: React Frontend Complete

| Page | Features | Status |
|------|----------|--------|
| Home | Landing, features, CTA | ✅ |
| SignUp | Registration with validation | ✅ |
| SignIn | Login with "remember me" | ✅ |
| Profile | Dietary condition setup | ✅ |
| Inventory | Food item CRUD, expiry tracking | ✅ |
| **Generate Meal Prep** | Main feature: get recommendations | ✅ |
| Meal Details | Full SHAP explanation, score | ✅ |
| What-If Analysis | Modify features, see impact | ✅ |
| Substitutions | Find healthier alternatives | ✅ |
| Favorites | Save & rate meals | ✅ |
| Daily Calendar | Meal planning & tracking | ✅ |

#### Recommendation search and explanations

On Generate Meal Prep, type meal or ingredient keywords such as `tomato`, `curry`, or `dhal` to filter the loaded recommendations. Separate alternatives with commas or `OR` (for example, `tomato OR coconut`); use `AND` when every term must match (for example, `tomato AND coconut`). Leave the field blank to browse all recommendation categories. Suggestions are drawn from the loaded meal names and ingredient data.

This is database-backed keyword matching, not an LLM-generated search. Scored recommendation cards show their strongest SHAP feature effects; the Meal Details page includes the full feature-impact view. A positive SHAP value supports the model's predicted class and a negative value pulls against it; these contributions are not suitability-score points or medical advice. Meals blocked by a hard safety rule show the rule's blocking reason instead.

### 🔄 Phase 12: Deployment (Next)

- Docker containerization
- docker-compose stack
- Production configuration
- Cloud deployment guides

---

## 📊 Architecture

```
Frontend (React 18 + TS)
      ↓↑
  API Client (Axios)
      ↓↑
Backend (FastAPI)
  ├─ Auth (JWT)
  ├─ Routes (50+ endpoints)
  └─ Services
      ├─ ML Pipeline (Decision Tree + XGBoost with SHAP)
      ├─ Recommendation Engine
      ├─ What-If Analysis
      └─ Meal Planning
         ↓↑
      Database (PostgreSQL)
         ├─ Users
         ├─ Profiles
         ├─ Inventory
         ├─ Recommendations
         ├─ Meal Plans
         ├─ Favorites
         └─ Analysis History
```

---

## 🔐 Security Features

- ✅ JWT Authentication (HS256)
- ✅ Bcrypt Password Hashing
- ✅ Rate Limiting (100 req/min)
- ✅ User Data Isolation
- ✅ Input Validation (Pydantic)
- ✅ CORS Configuration
- ✅ Error Safety (no stack traces)

---

## 📱 Tech Stack

### Backend
- **Framework**: FastAPI 0.104
- **Database**: PostgreSQL 12+ with SQLAlchemy ORM
- **Auth**: JWT (python-jose) + Bcrypt
- **ML**: scikit-learn, XGBoost, SHAP
- **API**: 50+ RESTful endpoints
- **Validation**: Pydantic

### Frontend
- **UI Framework**: React 18.2
- **Language**: TypeScript 5.3
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.4
- **State**: Zustand 4.4
- **HTTP**: Axios 1.6
- **Charts**: Recharts 2.10
- **UI Components**: Lucide React icons

---

## 🧪 Testing the App

### 1. Create Account
```
Email: test@example.com
Password: TestPassword123!
Name: Test User
```

### 2. Set Profile
- Dietary Condition: Diabetes
- Allergies: None
- Weight Objective: Maintain

### 3. Add Inventory
```
- Chicken breast (200g, expires in 5 days)
- Brown rice (500g, expires in 30 days)
- Broccoli (300g, expires in 3 days)
- Sweet potato (2 pieces, expires in 7 days)
```

### 4. Generate Recommendations
- Click "Generate Meal Prep"
- Select meal type: Breakfast
- View recommendations with scores
- Click "View Details" for SHAP explanation

### 5. Try What-If Analysis
- On meal details, click "Analyze What-If"
- Reduce sodium by 30%
- See score change and SHAP impact

### 6. Find Substitutes
- Click "Find Substitutes"
- Search for "butter"
- See olive oil as healthier alternative

### 7. Create Meal Plan
- Go to Daily Calendar
- Click "Generate Plan"
- See suggested meals for today
- Mark meals as eaten

---

## 📚 Documentation

- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete technical documentation
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[frontend/README.md](frontend/README.md)** - Frontend component guide
- **[ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md)** - Environment configuration
- **[backend/main.py](backend/main.py#L1)** - FastAPI auto-generated docs at `/docs`

---

## 🐳 Docker Setup (Coming - Phase 12)

```bash
# Build and run with Docker Compose
docker-compose up

# Services:
# - Backend: http://localhost:8000
# - Frontend: http://localhost:5173
# - Database: localhost:5432
```

---

## 🔧 Configuration

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/daine
SECRET_KEY=your-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATA_PATH=backend/data/food_db.xlsx
```

### Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:8000/api
```

See [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md) for complete configuration details.

---

## 📊 Database Schema

**12 Core Models**:
1. User - Authentication
2. UserProfile - Dietary preferences
3. InventoryItem - User's food inventory
4. Food - Food database
5. Recommendation - ML recommendation history
6. Recipe - Meal definitions
7. RecipeIngredient - Ingredients in recipes
8. MealPlan - Daily/weekly plans
9. PlannedMeal - Meals in plans
10. FavoriteMeal - User's favorites
11. WhatIfAnalysis - Analysis history
12. Substitution - Substitution records

All tables include `created_at`, `updated_at` timestamps and user isolation.

---

## 🤖 ML Model Details

### Original Pipeline (Preserved)
- File: `backend/daine_pipeline.py`
- Implementation: Unchanged - refactored to be callable
- Models: Decision Tree + XGBoost
- Features: 8 nutritional inputs
- Output: Suitability score (0-100)

### Safety Rules (Hard Constraints)
```
Diabetes:
  - GI Score ≤ 50 OR Carbs ≤ 40g
  - Carbs + GI Score < 100
  
Hypertension:
  - Sodium ≤ 1000mg
  
Cardiovascular:
  - Saturated Fat ≤ 5g
  - Cholesterol ≤ 200mg
  
Weight Management:
  - Calories ≤ 500 per meal
```

### SHAP Explanations
- Each recommendation includes SHAP contributions
- Shows which features helped (+) or hurt (-)
- Feature importance rankings
- Score build-up visualization

---

## 🚢 Deployment Options

### 1. Heroku + Netlify
```bash
# Backend to Heroku
heroku create daine-backend
git subtree push --prefix backend heroku main

# Frontend to Netlify
cd frontend
npm run build
# Connect to Netlify
```

### 2. Docker on VPS
```bash
docker-compose up -d
# Access at your-domain.com
```

### 3. Cloud Platforms
- **AWS**: EC2 + RDS + S3
- **Google Cloud**: App Engine + Cloud SQL
- **Azure**: App Service + Database
- **DigitalOcean**: App Platform + Managed DB

---

## 🛠️ Development

### Add a New Page
1. Create `frontend/src/pages/PageName.tsx`
2. Add route in `App.tsx`
3. Use `useAuthStore` for auth
4. Use `apiClient` for API calls

### Add API Endpoint
1. Create route in `backend/api/`
2. Create service in `backend/services/`
3. Register in `backend/main.py`
4. Add method to `frontend/src/api/client.ts`

### Run Tests (Coming)
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

---

## ⚠️ Important Notes

### Healthcare Compliance
This is a demonstration application. For production healthcare use:
- ✅ Implement HIPAA compliance
- ✅ Add user consent mechanisms
- ✅ Include medical disclaimers
- ✅ Implement audit logging
- ✅ Consult healthcare professionals
- ✅ Consider liability insurance

### Data Privacy
- All user data is encrypted
- Passwords hashed with bcrypt
- JWT tokens for authentication
- User data isolation on all queries

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check database connection
psql $DATABASE_URL

# Check Python version
python --version  # Should be 3.9+

# Check dependencies
pip install -r requirements.txt
```

### Frontend can't connect
```bash
# Check backend is running
curl http://localhost:8000/docs

# Check CORS origin
# Edit backend/main.py ALLOWED_ORIGINS

# Check Vite proxy
# Edit frontend/vite.config.ts
```

### Database connection refused
```bash
# Check PostgreSQL is running
pg_isready

# Check credentials
psql -U daine_user -d daine_db
```

---

## 📈 Performance

- **Model Loading**: Singleton pattern caches models (no reload per request)
- **Database**: Indexed queries for user isolation
- **API**: Rate limiting prevents abuse
- **Frontend**: Lazy loading, component splitting
- **Caching**: API response caching in Zustand

---

## 🎓 Learning Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **SQLAlchemy**: https://www.sqlalchemy.org/
- **Tailwind CSS**: https://tailwindcss.com/
- **SHAP**: https://shap.readthedocs.io/

---

## 📝 License & Attribution

This project demonstrates:
- Explainable AI in healthcare
- Full-stack web development
- ML model integration
- User-centered design

Original ML pipeline: `backend/daine_pipeline.py` (preserved and used directly by the backend)

---

## 🤝 Support

For issues or questions:
1. Check the [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
2. Review backend/README.md and frontend/README.md
3. Check FastAPI auto-docs at http://localhost:8000/docs
4. Review error messages and logs

---

## 📅 Roadmap

### ✅ Completed (Phases 1-11)
- Full backend with 50+ endpoints
- Complete React frontend (11 pages)
- SHAP explainability
- All core features

### 🔄 Next (Phase 12)
- Docker containerization
- Production deployment guides
- Cloud platform setup

### 🔮 Future Enhancements
- Mobile app (React Native)
- OAuth2 authentication
- Advanced analytics
- Community recipes
- Meal prep preparation steps
- Nutritionist consultation booking
- Real-time notifications

---

## 👥 Team Credits

Built as a comprehensive full-stack healthcare AI application demonstrating:
- Production-grade backend architecture
- Modern React frontend development
- Explainable AI integration
- Database design at scale
- Security best practices

---

**DAINE v1.0.0** | Production Ready | Phase 11 Complete

*Last Updated: 2024*
*Status: ✅ All core features implemented*

## Account Details 
- #1 Account 
Username: heidierin@gmail.com
Password: Min8Character$

-#2 Account 
Username: janedoe@gmail.com
Password: JaneDoe12#

-#3 Account 
Username: johndoe@gmail.com
Password: JohnDoe12#

Johndoe2@gmail.com
JohnDoe123$

janedoethree@gmail.com
JaneDoe1234%