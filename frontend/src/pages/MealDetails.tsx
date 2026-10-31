import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInventoryStore, useRecommendationStore } from '../store';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import {
  getMealIngredients,
  getLocalizedIngredientName,
  getMealInventoryStatus,
  isIngredientInInventory,
} from '../utils/mealIngredients';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader } from 'lucide-react';
import ScoreDisplay from '../components/ScoreDisplay';
import SHAPVisualization from '../components/SHAPVisualization';
import { useFoodLanguageStore } from '../store';
import { getLocalizedFoodName } from '../utils/foodName';

export const MealDetails: React.FC = () => {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const { currentRecommendation, setCurrentRecommendation } = useRecommendationStore();
  const { items: inventoryItems, setItems: setInventoryItems } = useInventoryStore();
  const foodLanguage = useFoodLanguageStore((state) => state.foodLanguage);
  const [meal, setMeal] = useState<any>(
    currentRecommendation?.food_id === mealId ? currentRecommendation : null
  );
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (!mealId) {
      setMeal(null);
      setIsLoading(false);
      return;
    }

    if (currentRecommendation?.food_id === mealId) {
      setMeal(currentRecommendation);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    apiClient.getSingleRecommendation(decodeURIComponent(mealId))
      .then(({ data }) => {
        if (isCurrent) {
          setMeal(data);
          setCurrentRecommendation(data);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setMeal(null);
          toast.error(getApiErrorMessage(error, 'Failed to load meal details'));
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [mealId, currentRecommendation, setCurrentRecommendation]);

  React.useEffect(() => {
    apiClient.getInventory()
      .then(({ data }) => setInventoryItems(data))
      .catch((error: unknown) => {
        toast.error(getApiErrorMessage(error, 'Failed to load household inventory'));
      });
  }, [setInventoryItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <Loader className="animate-spin text-forest/70" size={32} />
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-mist p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-forest/80 text-lg">Meal not found</p>
          <button
            onClick={() => navigate('/generate-meal-prep')}
            className="mt-4 text-forest/70 hover:text-forest/80 font-semibold"
          >
            Back to Recommendations
          </button>
        </div>
      </div>
    );
  }

  const ingredients = getMealIngredients(meal);
  const inventoryStatus = getMealInventoryStatus(ingredients, inventoryItems);

  return (
    <div className="min-h-screen bg-mist p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-forest/70 hover:text-forest/80 font-semibold mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Score & Summary */}
          <div className="md:col-span-1">
            <div className="bg-sage rounded-lg border border-sage p-6 sticky top-6">
              {/* Score Display */}
              <div className="mb-6">
                {meal.suitability_score != null ? (
                  <ScoreDisplay
                    score={meal.suitability_score}
                    label={meal.predicted_label}
                    size="md"
                  />
                ) : (
                  <p className="text-center text-sm text-forest/80">No suitability score available</p>
                )}
              </div>

              {/* Safety Status */}
              {(meal.is_blocked || meal.rule_pass === false) && (
                <div className="bg-mist border border-sage rounded-lg p-3 mb-6">
                  <p className="text-sm text-forest font-semibold">⚠ Blocked</p>
                  <p className="text-xs text-forest/80 mt-1">{meal.block_reason || meal.rule_block_reason}</p>
                </div>
              )}

              {/* Predictions */}
              <div className="space-y-3 mb-6 border-t border-sage pt-4">
                <h3 className="font-semibold text-forest text-sm">Model Predictions</h3>
                {meal.class_probabilities && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-forest/80">Recommended</span>
                      <span className="font-semibold">{Math.round(meal.class_probabilities.recommended * 100)}%</span>
                    </div>
                    <div className="w-full bg-sage rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-lime"
                        style={{ width: `${meal.class_probabilities.recommended * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest/80">Moderate</span>
                      <span className="font-semibold">{Math.round(meal.class_probabilities.moderate * 100)}%</span>
                    </div>
                    <div className="w-full bg-sage rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-lime"
                        style={{ width: `${meal.class_probabilities.moderate * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest/80">Not Recommended</span>
                      <span className="font-semibold">{Math.round(meal.class_probabilities.not_recommended * 100)}%</span>
                    </div>
                    <div className="w-full bg-sage rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-lime"
                        style={{ width: `${meal.class_probabilities.not_recommended * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 border-t border-sage pt-4">
                <button
                  onClick={() => toast.promise(
                    apiClient.addFavorite(meal.food_id, meal.food_name, 5),
                    {
                      loading: 'Adding...',
                      success: 'Added to favorites!',
                      error: (error: unknown) => getApiErrorMessage(error, 'Failed to add')
                    }
                  )}
                  className="w-full bg-lime hover:bg-lime/90 text-forest font-semibold py-2 rounded-lg transition-colors"
                >
                  ♥ Add to Favorites
                </button>
                <button
                  onClick={() => navigate('/what-if', { state: { foodId: meal.food_id } })}
                  className="w-full bg-lime hover:bg-lime/90 text-forest font-semibold py-2 rounded-lg transition-colors"
                >
                  Analyze What-If
                </button>
                <button
                  onClick={() => navigate('/substitutions', { state: { foodId: meal.food_id } })}
                  className="w-full bg-lime hover:bg-lime/90 text-forest font-semibold py-2 rounded-lg transition-colors"
                >
                  Find Substitutes
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Details & SHAP */}
          <div className="md:col-span-2 space-y-6">
            {/* Meal Header */}
            <div className="bg-sage rounded-lg border border-sage p-6">
              <h1 className="text-2xl font-bold text-forest mb-2">{getLocalizedFoodName(meal, foodLanguage)}</h1>
              <p className="text-forest/80">{meal.meal_type || meal.category || 'Meal'}</p>
              
              {/* Inventory Status */}
              <div className="mt-4 p-3 bg-sage rounded-lg">
                <p className="text-sm font-semibold text-forest">Inventory Status</p>
                <p className={`text-sm mt-1 ${
                  inventoryStatus === 'all' ? 'text-forest/80' :
                  inventoryStatus === 'partial' ? 'text-forest/80' :
                  'text-forest/80'
                }`}>
                  {inventoryStatus === 'all' && '✓ You have all required ingredients'}
                  {inventoryStatus === 'partial' && 'Some required ingredients are missing'}
                  {inventoryStatus === 'missing' && 'No required ingredients found in inventory'}
                  {!inventoryStatus && 'Ingredient availability unknown'}
                </p>
              </div>
            </div>

            {/* Nutritional Information */}
            <div className="bg-sage rounded-lg border border-sage p-6">
              <h2 className="text-lg font-bold text-forest mb-4">Nutritional Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-mist p-3 rounded-lg">
                  <div className="text-2xl font-bold text-forest">{meal.nutritional_summary?.calories ?? meal.calories ?? '-'}</div>
                  <div className="text-xs text-forest/80 mt-1">kcal</div>
                </div>
                <div className="bg-mist p-3 rounded-lg">
                  <div className="text-2xl font-bold text-forest">{meal.nutritional_summary?.carbs_g ?? meal.carbs ?? '-'}g</div>
                  <div className="text-xs text-forest/80 mt-1">Carbs</div>
                </div>
                <div className="bg-mist p-3 rounded-lg">
                  <div className="text-2xl font-bold text-forest">{meal.nutritional_summary?.protein_g ?? meal.protein ?? '-'}g</div>
                  <div className="text-xs text-forest/80 mt-1">Protein</div>
                </div>
                <div className="bg-mist p-3 rounded-lg">
                  <div className="text-2xl font-bold text-forest">{meal.nutritional_summary?.fat_g ?? meal.fat ?? '-'}g</div>
                  <div className="text-xs text-forest/80 mt-1">Fat</div>
                </div>
              </div>
              
              {/* Additional Nutrients */}
              {meal.nutritional_summary && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-forest/80">Fiber:</span>
                    <span className="font-semibold">{meal.nutritional_summary.fiber_g ?? '-'}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forest/80">Sodium:</span>
                    <span className="font-semibold">{meal.nutritional_summary.sodium_mg ?? '-'}mg</span>
                  </div>
                </div>
              )}
            </div>

            {ingredients.length > 0 && (
              <div className="bg-sage rounded-lg border border-sage p-6">
                <h2 className="text-lg font-bold text-forest mb-4">Ingredients</h2>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ingredient, index) => {
                    const { name, optional } = ingredient;
                    const available = isIngredientInInventory(ingredient, inventoryItems);
                    return (
                      <span
                        key={ingredient.id ?? `${name}-${index}`}
                        className={`rounded-full px-3 py-1.5 text-sm ${
                          available
                            ? 'border border-lime bg-lime font-semibold text-forest'
                            : optional
                              ? 'border border-dashed border-forest bg-mist text-forest'
                              : 'border border-sage bg-mist text-forest'
                        }`}
                      >
                        {ingredient ? getLocalizedIngredientName(ingredient, foodLanguage) : name}
                        {available ? ' - You already have this' : optional ? ' (optional)' : ''}
                      </span>
                    );
                  })}
                </div>
                {(meal.cooking_method || meal.preparation_notes) && (
                  <div className="mt-5 border-t border-sage pt-4 text-sm">
                    {meal.cooking_method && <p><span className="font-semibold">Cooking method: </span>{meal.cooking_method}</p>}
                    {meal.preparation_notes && <p className="mt-2 text-forest/80">{meal.preparation_notes}</p>}
                  </div>
                )}
              </div>
            )}

            {/* SHAP Explanation */}
            {meal.shap_contributions && (
              <div className="bg-sage rounded-lg border border-sage p-6">
                <h2 className="text-lg font-bold text-forest mb-4">Model Explanation (SHAP)</h2>
                <SHAPVisualization
                  contributions={meal.shap_contributions}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealDetails;
