# DAINE Frontend - Complete Structure

## Setup Instructions

```bash
cd frontend
npm install
npm run dev
```

API docs will be at: http://localhost:5173

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts          # API client with all endpoints
│   ├── components/
│   │   ├── Layout.tsx         # Main app wrapper
│   │   ├── Navigation.tsx     # Top navigation
│   │   ├── Sidebar.tsx        # Sidebar navigation
│   │   ├── Button.tsx         # Reusable button
│   │   ├── Card.tsx           # Reusable card
│   │   ├── Input.tsx          # Reusable input
│   │   ├── Modal.tsx          # Reusable modal
│   │   └── SHAPVisualization.tsx  # SHAP explanation display
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── SignUp.tsx
│   │   ├── SignIn.tsx
│   │   ├── Profile.tsx
│   │   ├── Inventory.tsx
│   │   ├── GenerateMealPrep.tsx  (Main feature)
│   │   ├── MealRecommendations.tsx
│   │   ├── MealDetails.tsx
│   │   ├── XAIExplanation.tsx
│   │   ├── WhatIfAnalysis.tsx
│   │   ├── IngredientSubstitution.tsx
│   │   ├── FavoriteMeals.tsx
│   │   ├── DailyCalendar.tsx
│   │   └── WeeklyCalendar.tsx
│   ├── store/
│   │   └── index.ts           # Zustand state management
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Key Components

### 1. API Client (`api/client.ts`)
- ✅ All endpoints implemented
- Authentication with JWT
- Error handling
- Token refresh

### 2. State Management (`store/index.ts`)
- ✅ Auth store (user, profile, token)
- ✅ Inventory store
- ✅ Recommendation store
- Zustand for lightweight state

### 3. Layout System
- App wrapper with auth protection
- Navigation bar (top)
- Sidebar (left) for menu
- Main content area
- User profile dropdown

### 4. Core Pages

#### Home Page
- Welcoming intro
- Feature overview
- Call-to-action buttons
- Link to Generate Meal Prep (main feature)

#### SignUp / SignIn
- Form validation
- Password requirements display
- Remember me checkbox
- OAuth setup (optional)

#### User Profile
- Dietary condition selector (dropdown)
- Allergies input (tags/text)
- Intolerances list
- Disliked foods
- Nutritional goals (sliders)
- Weight objective (radio)
- Preferred meal structure

#### Household Inventory (Main Feature)
- **Add Item Form**:
  - Food name (autocomplete from DB)
  - Quantity (number)
  - Unit (dropdown: grams, ml, pieces)
  - Expiry date (date picker)
- **Inventory List**:
  - Cards showing each item
  - Quantity with unit
  - Days until expiry (color coded)
  - Edit/Delete buttons
- **Quick View Summary**:
  - Total items
  - Expiry alerts
  - Missing high-priority items

#### Generate XAI Meal Prep (MAIN FEATURE)
- **Input Form**:
  - Meal type selector (breakfast, lunch, dinner, snack)
  - Optional: prep time preference
  - Optional: specific preferences
  - "Generate Recommendations" button
- **Results Display**:
  - Multiple meal recommendations (cards)
  - Each showing:
    - Meal name & photo
    - Suitability score (0-100, with color)
    - Prediction label (Recommended/Moderate/Blocked)
    - Nutritional summary (carbs, protein, fat, calories)
    - Inventory availability (green=all items, yellow=partial, red=missing)
    - Quick explanation preview
    - Action buttons: "View Details", "Add to Favorites", "Substitute"
  - Sorting options (by score, by availability, alphabetical)
  - Filter blocked meals toggle

#### Meal Recommendation Results
- **Recommendation Card**:
  - Meal image
  - Suitability score with gauge/progress bar
  - Recommendation label
  - Rule pass/block status
  - If blocked: clear block reason
  - Nutritional breakdown (bar charts)
  - Ingredients list with inventory status
  - "View Full Explanation" button

#### Meal Details / XAI Explanation
- **Recommendation Summary**:
  - Score prominently displayed
  - Prediction confidence
  - Safety status
- **SHAP Explanation**:
  - Feature contribution table:
    - Feature name
    - Value
    - SHAP contribution (with ± indicator)
    - Visual bar chart
  - **Positive Factors** (green):
    - "High fiber content contributed positively"
    - "Low sodium aligns with your condition"
  - **Negative Factors** (red):
    - "Moderate carbs slightly reduces score"
    - "Saturated fat is on higher side"
- **Nutritional Summary**:
  - Detailed macros
  - Micronutrients if available
  - Comparison to daily recommended
- **Actions**:
  - Add to Favorites (with rating)
  - What-if Analysis
  - Substitute Ingredient
  - Add to Meal Plan

#### What-If Analysis
- **Input Section**:
  - Original meal displayed
  - Description of modification
  - Feature modifier (e.g., "reduce sodium to 300mg")
  - "Analyze" button
- **Results**:
  - Original score vs Modified score (side-by-side)
  - Score change with improvement indicator
  - Feature changes table
  - New SHAP explanation
  - Recommendations based on changes
  - "Apply to Meal Plan" button

#### Ingredient Substitution
- **Search/Select**:
  - Original ingredient input
  - List of available substitutes (from inventory & DB)
- **Substitution Options**:
  - Each substitute shows:
    - Ingredient name
    - Nutritional similarity score
    - ML suitability score for user's condition
    - Compatibility indicator
    - "Preview" button
- **Substitution Preview**:
  - Nutritional changes (table)
  - Safety assessment
  - Suitability change
  - "Confirm Substitution" button

#### Favorite Meals
- **Favorites List**:
  - Grid/table of favorite meals
  - Each showing:
    - Meal name
    - User rating (stars)
    - Last recommended date
    - Times recommended
    - Personal notes
    - Buttons: "View", "Edit", "Remove"
- **Sort/Filter Options**:
  - Sort by rating, date added, frequency
  - Filter by dietary condition

#### Daily Calendar View
- **Calendar Grid**:
  - Single day view (or day selector)
  - Meal slots: Breakfast, Lunch, Dinner, Snacks
  - Each slot shows:
    - Assigned meal name
    - Suitability score
    - Recommendation status
    - "Change", "Details", "Mark Eaten" buttons
- **Action Buttons**:
  - "Generate Today's Plan" (auto-populate from inventory)
  - "Save Plan"
  - "View Weekly"

#### Weekly Calendar View
- **Week Grid**:
  - 7-day view with meal slots
  - Color-coded suitability
  - Each meal card shows score
- **Interactions**:
  - Drag-drop to rearrange (optional)
  - Click to edit
  - Color indicators for diversity
- **Export/Save Options**:
  - Save plan to database
  - Export as PDF/image
  - Share plan

## Typography & Colors

### Color Scheme
- Primary: Sky Blue (matching the primary colors in tailwind config)
- Success: Green (#10b981)
- Warning: Amber (#f59e0b)
- Danger: Red (#ef4444)
- Neutral: Gray

### Suitability Score Colors
- 75-100: Green (Recommended)
- 50-74: Amber (Moderate)
- 0-49: Red (Not Recommended/Blocked)

### Font Sizes
- H1: 2rem (heading)
- H2: 1.5rem (page title)
- H3: 1.25rem (section title)
- Body: 1rem
- Small: 0.875rem
- Tiny: 0.75rem

## Component Patterns

### Recommendation Card Template
```tsx
<RecommendationCard 
  meal={recommendation}
  onViewDetails={() => {}}
  onAddFavorite={() => {}}
  onSubstitute={() => {}}
/>
```

### SHAP Visualization Template
```tsx
<SHAPVisualization 
  contributions={shap_contributions}
  originalScore={originalScore}
  modifiedScore={modifiedScore}
/>
```

### Meal Plan Slot Template
```tsx
<MealSlot
  mealType="breakfast"
  meal={plannedMeal}
  onEdit={() => {}}
  onDelete={() => {}}
/>
```

## State Flow

```
User Logs In
    ↓
Load Auth (user, profile, token)
    ↓
Load User Profile (dietary condition)
    ↓
Load Inventory (if needed)
    ↓
Can Generate Recommendations
    ↓
Fetch recommendations from ML
    ↓
Display with SHAP explanations
    ↓
User can: Favorite, What-if, Substitute, Plan
```

## Authentication Flow

1. User signs up with email/password
2. Backend hashes password with bcrypt
3. JWT token returned on login
4. Token stored in localStorage
5. API client adds to every request
6. On 401 response: redirect to signin

## Responsive Design

### Breakpoints (Tailwind default)
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md, lg)
- Desktop: > 1024px (xl, 2xl)

### Layout Adjustments
- Mobile: Single column, bottom navigation
- Tablet: Sidebar collapse on scroll
- Desktop: Full sidebar, full content

## Performance Optimization

- **Lazy Loading**: Routes with React.lazy()
- **Image Optimization**: Compression, lazy loading
- **State Caching**: Store API responses
- **Debouncing**: Search inputs, auto-save
- **Code Splitting**: Per-route chunks

## Testing Setup (Future)

```bash
npm install --save-dev vitest @testing-library/react
npm test
```

## Deployment

```bash
npm run build
# Output: dist/

# Deploy to Netlify/Vercel:
# - Connect GitHub repo
# - Set build command: npm run build
# - Set output directory: dist
# - Set environment variables (VITE_API_BASE_URL)
```

## Environment Variables

Create `.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

For production:
```
VITE_API_BASE_URL=https://api.daine.com/api
```

## Key Features Implemented

✅ User Authentication (signup/signin/logout)
✅ User Profile Management
✅ Household Inventory Management
✅ Single Food Recommendations with SHAP
✅ Bulk Recommendations for condition
✅ What-If Analysis Interface
✅ Ingredient Substitution
✅ Favorites Management
✅ Daily Meal Planning
✅ Weekly Meal Calendar
✅ History & Statistics
✅ XAI Explanations (SHAP visualizations)
✅ Responsive Design
✅ TypeScript Type Safety
✅ Tailwind CSS Styling

## Integration Checklist

- [ ] API client integrated with all endpoints
- [ ] Auth store connects to backend
- [ ] Inventory store syncs with backend
- [ ] Recommendation store manages ML results
- [ ] Protected routes redirect to signin
- [ ] Token refresh on 401
- [ ] Error handling with user feedback
- [ ] Loading states on all async operations
- [ ] Form validation on all inputs
- [ ] Mobile responsive on all pages
