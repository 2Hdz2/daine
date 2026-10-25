import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import toast from 'react-hot-toast';
import { Home, Loader } from 'lucide-react';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, setProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(profile || {
    dietary_condition: '',
    allergies: '',
    intolerances: '',
    disliked_foods: '',
    weight_objective: '',
    preferred_meal_structure: '',
  });

  React.useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getProfile();
      if (res.data) {
        setFormData(res.data);
        setProfile(res.data);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setProfile(null);
      } else {
        toast.error(getApiErrorMessage(error, 'Failed to load profile'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dietary_condition) {
      toast.error('Please select a dietary condition');
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (profile) {
        res = await apiClient.updateProfile(formData);
      } else {
        try {
          res = await apiClient.createProfile(formData);
        } catch (error: unknown) {
          const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
          if (
            !axios.isAxiosError(error) ||
            error.response?.status !== 400 ||
            typeof detail !== 'string' ||
            !detail.startsWith('Profile already exists')
          ) {
            throw error;
          }
          res = await apiClient.updateProfile(formData);
        }
      }
      setProfile(res.data);
      toast.success('Profile saved successfully!');
      navigate('/generate-meal-prep');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to save profile'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-forest">User Profile</h1>
            <p className="text-forest/80 mt-2">Set up your dietary preferences and health information</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Go to home page"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-forest px-3 py-2 text-sm font-semibold text-forest transition-colors hover:bg-sage/80"
          >
            <Home size={18} />
            Home
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-forest/70" size={32} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-sage rounded-lg border border-sage p-8 space-y-6">
            {/* Dietary Condition - Required */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Primary Dietary Condition *
              </label>
              <select
                value={formData.dietary_condition}
                onChange={(e) => setFormData({ ...formData, dietary_condition: e.target.value })}
                className="w-full px-4 py-3 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
              >
                <option value="">-- Select your condition --</option>
                <option value="diabetes">Diabetes</option>
                <option value="hypertension">Hypertension</option>
                <option value="cardiovascular">Cardiovascular Disease</option>
                <option value="weight_management">Weight Management</option>
                <option value="none">No specific condition</option>
              </select>
              <p className="text-sm text-forest/80 mt-1">
                This helps personalize meal recommendations with safety rules for your condition
              </p>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Food Allergies
              </label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="E.g., peanuts, shellfish, tree nuts (comma-separated)"
                rows={2}
                className="w-full px-4 py-3 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
              />
            </div>

            {/* Intolerances */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Food Intolerances
              </label>
              <textarea
                value={formData.intolerances}
                onChange={(e) => setFormData({ ...formData, intolerances: e.target.value })}
                placeholder="E.g., lactose, gluten, eggs (comma-separated)"
                rows={2}
                className="w-full px-4 py-3 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
              />
            </div>

            {/* Disliked Foods */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Disliked Foods
              </label>
              <textarea
                value={formData.disliked_foods}
                onChange={(e) => setFormData({ ...formData, disliked_foods: e.target.value })}
                placeholder="E.g., mushrooms, olives, beets (comma-separated)"
                rows={2}
                className="w-full px-4 py-3 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
              />
            </div>

            {/* Weight Objective */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Weight Objective
              </label>
              <div className="space-y-2">
                {['maintain', 'lose', 'gain'].map(option => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="weight_objective"
                      value={option}
                      checked={formData.weight_objective === option}
                      onChange={(e) => setFormData({ ...formData, weight_objective: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="text-forest capitalize">{option} weight</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Meal Preference */}
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">
                Preferred Meal Structure
              </label>
              <select
                value={formData.preferred_meal_structure}
                onChange={(e) => setFormData({ ...formData, preferred_meal_structure: e.target.value })}
                className="w-full px-4 py-3 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
              >
                <option value="">-- Select preferred structure --</option>
                <option value="3-meals">3 Meals + Snacks</option>
                <option value="2-meals">2 Larger Meals</option>
                <option value="intermittent-fasting">Intermittent Fasting</option>
                <option value="grazing">Grazing (Small Frequent Meals)</option>
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-mist border border-sage rounded-lg p-4">
              <p className="text-sm text-forest">
                <strong>Privacy:</strong> Your dietary information is securely stored and used only for personalizing your meal recommendations.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex gap-4 pt-4 border-t border-sage">
              <button
                type="submit"
                disabled={isSaving || !formData.dietary_condition}
                className="flex-1 bg-forest hover:bg-forest/90 disabled:bg-sage text-mist font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSaving && <Loader className="animate-spin" size={18} />}
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
