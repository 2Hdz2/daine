import { create } from 'zustand';

export type FoodLanguage = 'en' | 'si' | 'ta';

const storedFoodLanguage = localStorage.getItem('food-language');
const initialFoodLanguage: FoodLanguage =
  storedFoodLanguage === 'si' || storedFoodLanguage === 'ta' ? storedFoodLanguage : 'en';

interface FoodLanguageStore {
  foodLanguage: FoodLanguage;
  setFoodLanguage: (language: FoodLanguage) => void;
}

export const useFoodLanguageStore = create<FoodLanguageStore>((set) => ({
  foodLanguage: initialFoodLanguage,
  setFoodLanguage: (foodLanguage) => {
    localStorage.setItem('food-language', foodLanguage);
    set({ foodLanguage });
  },
}));

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
}

interface UserProfile {
  dietary_condition: string;
  allergies?: string;
  intolerances?: string;
  disliked_foods?: string;
  nutritional_goals?: any;
  weight_objective?: string;
  preferred_meal_structure?: string;
}

interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ user: null, profile: null, token: null, isAuthenticated: false });
  },
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface InventoryStore {
  items: any[];
  summary: any | null;
  isLoading: boolean;
  error: string | null;
  
  setItems: (items: any[]) => void;
  setSummary: (summary: any) => void;
  addItem: (item: any) => void;
  removeItem: (itemId: number) => void;
  updateItem: (itemId: number, item: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  items: [],
  summary: null,
  isLoading: false,
  error: null,
  
  setItems: (items) => set({ items }),
  setSummary: (summary) => set({ summary }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  removeItem: (itemId) => set((state) => ({ 
    items: state.items.filter(item => item.id !== itemId) 
  })),
  updateItem: (itemId, item) => set((state) => ({
    items: state.items.map(i => i.id === itemId ? item : i)
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

interface RecommendationStore {
  recommendations: any;
  currentRecommendation: any | null;
  history: any[];
  isLoading: boolean;
  error: string | null;
  
  setRecommendations: (recs: any) => void;
  setCurrentRecommendation: (rec: any | null) => void;
  setHistory: (history: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRecommendationStore = create<RecommendationStore>((set) => ({
  recommendations: null,
  currentRecommendation: null,
  history: [],
  isLoading: false,
  error: null,
  
  setRecommendations: (recommendations) => set({ recommendations }),
  setCurrentRecommendation: (currentRecommendation) => set({ currentRecommendation }),
  setHistory: (history) => set({ history }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
