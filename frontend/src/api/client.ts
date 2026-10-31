import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.token = localStorage.getItem('token');
    if (this.token) {
      this.setAuthHeader(this.token);
    }

    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/signin';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthHeader(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuth() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Auth endpoints
  async signup(email: string, password: string, fullName?: string) {
    return this.client.post('/auth/signup', { email, password, full_name: fullName });
  }

  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  async getCurrentUser() {
    return this.client.get('/auth/me');
  }

  // Profile endpoints
  async createProfile(profileData: any) {
    return this.client.post('/profile', profileData);
  }

  async getProfile() {
    return this.client.get('/profile');
  }

  async updateProfile(profileData: any) {
    return this.client.put('/profile', profileData);
  }

  // Inventory endpoints
  async addInventoryItem(item: any) {
    return this.client.post('/inventory', item);
  }

  async getInventory(excludeExpired = true) {
    return this.client.get('/inventory', { params: { exclude_expired: excludeExpired } });
  }

  async getInventorySummary() {
    return this.client.get('/inventory/summary');
  }

  async updateInventoryItem(itemId: number, data: any) {
    return this.client.put(`/inventory/${itemId}`, data);
  }

  async deleteInventoryItem(itemId: number) {
    return this.client.delete(`/inventory/${itemId}`);
  }

  // Recommendation endpoints
  async getSingleRecommendation(foodId: string, modelType = 'tree') {
    return this.client.post('/recommendations/single', { food_id: foodId, model_type: modelType });
  }

  async getAllRecommendations(modelType = 'tree') {
    return this.client.get('/recommendations/all', { params: { model_type: modelType } });
  }

  async getRecommendationHistory(limit = 20) {
    return this.client.get('/recommendations/history', { params: { limit } });
  }

  // What-If Analysis
  async analyzeWhatIf(foodId: string, modification: string, modifiedFeatures?: any) {
    return this.client.post('/what-if/analyze', {
      original_food_id: foodId,
      modification,
      modified_features: modifiedFeatures,
    });
  }

  async getWhatIfHistory(limit = 10) {
    return this.client.get('/what-if/history', { params: { limit } });
  }

  // Substitutions
  async findSubstitutes(ingredient: string) {
    return this.client.get(`/substitutions/find/${ingredient}`);
  }

  async evaluateSubstitution(originalFoodId: string, originalIngredient: string, substituteIngredient: string) {
    return this.client.post('/substitutions/evaluate', {
      original_food_id: originalFoodId,
      original_ingredient: originalIngredient,
      substitute_ingredient: substituteIngredient,
    });
  }

  // Meal Planning
  async createMealPlan(plan: any) {
    return this.client.post('/meal-plans', plan);
  }

  async getMealPlans(limit = 10) {
    return this.client.get('/meal-plans', { params: { limit } });
  }

  async getMealPlan(mealPlanId: number) {
    return this.client.get(`/meal-plans/${mealPlanId}`);
  }

  async generateDailyPlan(date: string) {
    return this.client.post('/meal-plans/generate-daily', { plan_date: date });
  }

  async generateWeeklyPlan(startDate: string) {
    return this.client.post('/meal-plans/generate-weekly', { start_date: startDate });
  }

  async addMealToPlan(mealPlanId: number, meal: any) {
    return this.client.post(`/meal-plans/${mealPlanId}/meals`, meal);
  }

  async markMealEaten(mealId: number) {
    return this.client.patch(`/meal-plans/meals/${mealId}/eat`);
  }

  // Favorites
  async addFavorite(foodId: string, foodName: string, rating?: number) {
    return this.client.post('/favorites', { food_id: foodId, food_name: foodName, user_rating: rating });
  }

  async getFavorites(limit = 50) {
    return this.client.get('/favorites', { params: { limit } });
  }

  async updateFavorite(favoriteId: number, data: any) {
    return this.client.put(`/favorites/${favoriteId}`, data);
  }

  async deleteFavorite(favoriteId: number) {
    return this.client.delete(`/favorites/${favoriteId}`);
  }

  // History & Stats
  async getUserStats() {
    return this.client.get('/history/stats');
  }
}

export const apiClient = new ApiClient();
