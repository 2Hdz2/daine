# DAINE - Environment Configuration Templates

## Backend (.env)
# Copy this to backend/.env and fill in your values

# Database Configuration
DATABASE_URL=postgresql://daine_user:daine_password@localhost:5432/daine_db

# JWT Security
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ML Configuration
DATA_PATH=data/food_db.xlsx
ML_CACHE_ENABLED=true

# API Configuration
API_TITLE=DAINE - Explainable AI Dietary Decision-Support
API_VERSION=1.0.0
DEBUG=false

# CORS Configuration (for development)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_MINUTES=1

# Email Configuration (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@daine.com

---

## Frontend (.env.local)
# Copy this to frontend/.env.local

# API Base URL
VITE_API_BASE_URL=http://localhost:8000/api

# Application Settings
VITE_APP_NAME=DAINE
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_WHAT_IF=true
VITE_ENABLE_SUBSTITUTIONS=true
VITE_ENABLE_MEAL_PLANNING=true

---

## Docker Environment (.env for docker-compose)
# For use with docker-compose.yml

# PostgreSQL
POSTGRES_USER=daine_user
POSTGRES_PASSWORD=daine_password
POSTGRES_DB=daine_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Backend
BACKEND_SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
BACKEND_ALGORITHM=HS256
BACKEND_ACCESS_TOKEN_EXPIRE_MINUTES=30
BACKEND_DATABASE_URL=postgresql://daine_user:daine_password@postgres:5432/daine_db
BACKEND_DEBUG=false

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api

---

## Production Environment (.env.production)
# For production deployment

# Database Configuration
DATABASE_URL=postgresql://prod_user:prod_secure_password@prod-db-host:5432/daine_prod

# JWT Security (GENERATE NEW SECRET)
SECRET_KEY=generate-a-new-secure-random-string-of-at-least-32-characters

# API Configuration
DEBUG=false
ENVIRONMENT=production

# CORS Configuration
ALLOWED_ORIGINS=https://daine.example.com,https://app.daine.example.com

# Frontend API Base
VITE_API_BASE_URL=https://api.daine.example.com/api

---

## Generating a Secure SECRET_KEY

Python:
```python
import secrets
print(secrets.token_urlsafe(32))
```

Bash:
```bash
openssl rand -hex 32
```

---

## Database Setup

### Local Development (PostgreSQL)

```bash
# Create database and user
createuser daine_user -P
createdb daine_db -O daine_user

# Or with Docker:
docker run --name daine-postgres \
  -e POSTGRES_USER=daine_user \
  -e POSTGRES_PASSWORD=daine_password \
  -e POSTGRES_DB=daine_db \
  -p 5432:5432 \
  -d postgres:15
```

---

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local if needed
npm run dev
```

---

## Verification Checklist

- [ ] Database URL is correct and database exists
- [ ] SECRET_KEY is changed from default
- [ ] DATA_PATH points to food_db.xlsx
- [ ] CORS origins are correct for your domain
- [ ] Email configuration (if using email features)
- [ ] All required environment variables set
- [ ] No secrets committed to git (.env in .gitignore)

---

## Troubleshooting

**Backend won't start**:
- Check DATABASE_URL is correct: `psql $DATABASE_URL`
- Ensure database exists: `psql -l`
- Check SECRET_KEY is set and valid

**Frontend can't connect to API**:
- Verify VITE_API_BASE_URL matches backend URL
- Check CORS_ORIGINS in backend includes frontend origin
- Ensure backend is running: `curl http://localhost:8000/docs`

**Database connection refused**:
- PostgreSQL service running: `pg_isready`
- Firewall allows connection to port 5432
- Credentials are correct

---

Generated for DAINE v1.0.0
