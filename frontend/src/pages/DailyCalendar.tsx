import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import toast from 'react-hot-toast';
import { Loader, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const MealCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  React.useEffect(() => {
    loadMealPlans();
  }, []);

  const loadMealPlans = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getMealPlans();
      setMealPlans(res.data);
      if (res.data.length > 0) {
        setSelectedPlan(res.data[0]);
      }
    } catch (error: any) {
      toast.error('Failed to load meal plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDailyPlan = async () => {
    setIsLoading(true);
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const res = await apiClient.generateDailyPlan(dateStr);
      setSelectedPlan(res.data);
      setMealPlans([res.data, ...mealPlans]);
      setShowForm(false);
      toast.success('Daily plan generated!');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to generate plan'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkEaten = async (mealId: number) => {
    try {
      await apiClient.markMealEaten(mealId);
      setSelectedPlan({
        ...selectedPlan,
        meals: selectedPlan.meals?.map((meal: any) =>
          meal.id === mealId ? { ...meal, eaten: true } : meal
        ),
      });
      toast.success('Meal marked as eaten');
    } catch (error: any) {
      toast.error('Failed to mark meal');
    }
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="min-h-screen bg-mist p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest">Meal Calendar</h1>
          <p className="text-forest/80 mt-2">Plan and track your daily meals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Date Picker & Plans */}
          <div className="lg:col-span-1">
            <div className="bg-sage rounded-lg border border-sage p-4 sticky top-6">
              {/* Date Navigation */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCurrentDate(addDays(currentDate, -1))}
                    className="p-1 hover:bg-sage/80 rounded"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-bold text-forest">
                    {format(currentDate, 'MMM d, yyyy')}
                  </span>
                  <button
                    onClick={() => setCurrentDate(addDays(currentDate, 1))}
                    className="p-1 hover:bg-sage/80 rounded"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <input
                  type="date"
                  value={format(currentDate, 'yyyy-MM-dd')}
                  onChange={(e) => setCurrentDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40 text-sm"
                />
              </div>

              {/* Generate Plan Button */}
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full bg-forest hover:bg-forest/90 text-mist font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <Plus size={18} />
                Generate Plan
              </button>

              {/* Recent Plans */}
              <h3 className="font-semibold text-forest mb-2 text-sm">Recent Plans</h3>
              <div className="space-y-2">
                {isLoading ? (
                  <Loader className="animate-spin text-forest/70 mx-auto" size={20} />
                ) : mealPlans.length === 0 ? (
                  <p className="text-xs text-forest/80">No plans yet</p>
                ) : (
                  mealPlans.slice(0, 5).map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full text-left p-2 rounded-lg border transition-all text-sm ${
                        selectedPlan?.id === plan.id
                          ? 'border-forest/40 bg-mist'
                          : 'border-sage hover:border-sage'
                      }`}
                    >
                      <div className="font-semibold text-forest">
                        {format(new Date(plan.plan_date), 'MMM d')}
                      </div>
                      <div className="text-xs text-forest/80">
                        {plan.meals?.length || 0} meals
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Generate Form */}
            {showForm && (
              <div className="bg-sage rounded-lg border border-sage p-6 mb-6">
                <h3 className="font-bold text-forest mb-4">Generate Daily Plan for {format(currentDate, 'MMMM d')}</h3>
                <p className="text-forest/80 mb-4">
                  We'll suggest meals based on your dietary condition and available inventory.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleGenerateDailyPlan}
                    disabled={isLoading}
                    className="flex-1 bg-forest hover:bg-forest/90 disabled:bg-sage text-mist font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader className="animate-spin" size={18} />}
                    {isLoading ? 'Generating...' : 'Generate Plan'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-sage hover:bg-sage/80 text-forest font-semibold py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Selected Plan */}
            {selectedPlan ? (
              <div className="space-y-4">
                {mealTypes.map(mealType => {
                  const meal = selectedPlan.meals?.find((m: any) => m.meal_type === mealType);
                  return (
                    <div
                      key={mealType}
                      className="bg-sage rounded-lg border border-sage p-6"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-forest capitalize">{mealType}</h3>
                        {meal?.eaten && (
                          <span className="text-xs font-semibold text-forest/80 bg-mist px-2 py-1 rounded">
                            ✓ Eaten
                          </span>
                        )}
                      </div>

                      {meal ? (
                        <div className="bg-sage p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold text-forest">{meal.food_name}</div>
                              <div className="text-sm text-forest/80">
                                Score: {Math.round(meal.suitability_score)}/100
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                meal.suitability_score >= 75 ? 'bg-mist text-forest' :
                                meal.suitability_score >= 50 ? 'bg-mist text-forest' :
                                'bg-mist text-forest'
                              }`}>
                                {meal.predicted_label}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/meal/${encodeURIComponent(meal.food_id)}`)}
                              className="flex-1 bg-forest hover:bg-forest/90 text-mist font-semibold py-2 rounded-lg transition-colors text-sm"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleMarkEaten(meal.id)}
                              disabled={meal.eaten}
                              className={`flex-1 font-semibold py-2 rounded-lg transition-colors text-sm ${
                                meal.eaten
                                  ? 'bg-sage text-forest/80 cursor-default'
                                  : 'bg-forest hover:bg-forest/90 text-mist'
                              }`}
                            >
                              {meal.eaten ? 'Eaten ✓' : 'Mark Eaten'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-sage p-4 rounded-lg text-center">
                          <p className="text-forest/80 text-sm">No {mealType} planned</p>
                          <button
                            onClick={() => toast.success('Coming soon!')}
                            className="mt-2 text-forest/70 hover:text-forest/80 font-semibold text-sm"
                          >
                            Add meal
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-sage rounded-lg border border-sage p-12 text-center">
                <p className="text-forest/80 text-lg mb-4">No meal plan selected</p>
                <button
                  onClick={handleGenerateDailyPlan}
                  className="bg-forest hover:bg-forest/90 text-mist font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Generate Today's Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCalendar;
