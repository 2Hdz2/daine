import React from 'react';
import { Heart, ChevronRight } from 'lucide-react';
import {
  getMealIngredients,
  getLocalizedIngredientName,
  getMealInventoryStatus,
  isIngredientInInventory,
} from '../utils/mealIngredients';
import { useFoodLanguageStore } from '../store';
import { getLocalizedFoodName } from '../utils/foodName';

interface InventoryItem {
  food_name: string;
}

interface RecommendationCardProps {
  meal: any;
  onViewDetails: () => void;
  onAddFavorite: () => void;
  isFavorite: boolean;
  onSubstitute: () => void;
  inventoryItems: InventoryItem[];
  onAddToPlan?: () => void;
}

const modelFeatureLabels: Record<string, { label: string; unit: string }> = {
  carbs_g: { label: 'Carbohydrates', unit: 'g' },
  protein_g: { label: 'Protein', unit: 'g' },
  fat_g: { label: 'Total fat', unit: 'g' },
  saturated_fat_g: { label: 'Saturated fat', unit: 'g' },
  fiber_g: { label: 'Fiber', unit: 'g' },
  sodium_mg: { label: 'Sodium', unit: 'mg' },
  calories: { label: 'Calories', unit: 'kcal' },
  gi_score: { label: 'Glycemic index', unit: '' },
};

const formatModelFeatureValue = (feature: string, value: number): string => {
  if (feature === 'gi_score') {
    return ['Low', 'Moderate', 'High'][value] ?? value.toFixed(0);
  }

  const unit = modelFeatureLabels[feature]?.unit;
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${unit ? ` ${unit}` : ''}`;
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  meal,
  onViewDetails,
  onAddFavorite,
  isFavorite,
  onSubstitute,
  inventoryItems,
  onAddToPlan,
}) => {
  const nutrition = meal.nutritional_summary || {};
  const ingredients = getMealIngredients(meal);
  const inventoryStatus = getMealInventoryStatus(ingredients, inventoryItems);
  const foodLanguage = useFoodLanguageStore((state) => state.foodLanguage);
  const topModelFactors = (meal.shap_contributions || [])
    .filter((factor: { feature?: string; shap_contribution?: number }) =>
      factor.feature && Number.isFinite(factor.shap_contribution),
    )
    .sort((a: { shap_contribution: number }, b: { shap_contribution: number }) =>
      Math.abs(b.shap_contribution) - Math.abs(a.shap_contribution),
    )
    .slice(0, 3);
  const getScoreColor = () => {
    if (meal.suitability_score >= 75) return 'bg-sage text-forest border-sage';
    if (meal.suitability_score >= 50) return 'bg-sage text-forest border-sage';
    return 'bg-sage text-forest border-sage';
  };

  const getInventoryColor = () => {
    if (inventoryStatus === 'all') return 'text-forest/80';
    if (inventoryStatus === 'partial') return 'text-forest/80';
    return 'text-forest/80';
  };

  const getInventoryIcon = () => {
    if (inventoryStatus === 'all') return '✓ You have all required ingredients';
    if (inventoryStatus === 'partial') {
      const availableCount = ingredients.filter(
        (ingredient) => !ingredient.optional && isIngredientInInventory(ingredient.name, inventoryItems),
      ).length;
      const requiredCount = ingredients.filter((ingredient) => !ingredient.optional).length;
      return `~ You already have ${availableCount} of ${requiredCount} required ingredients`;
    }
    if (inventoryStatus === 'missing') return '✗ No required ingredients found in inventory';
    return 'Ingredient availability unknown';
  };

  return (
    <div className="bg-sage rounded-lg border border-sage overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with Score */}
      <div className="p-4 bg-gradient-to-r from-mist to-mist">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-forest">{getLocalizedFoodName(meal, foodLanguage)}</h3>
            <p className="text-sm text-forest/80">{meal.category || 'Meal'}</p>
          </div>
          <button 
            onClick={onAddFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            className={`transition-colors ${isFavorite ? 'text-forest/70' : 'text-forest/50 hover:text-forest/70'}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Score Circle */}
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl ${getScoreColor()}`}>
            {meal.suitability_score == null ? '—' : Math.round(meal.suitability_score)}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-forest">{meal.predicted_label || 'Not scored'}</div>
            <div className="text-sm text-forest/80">Suitability</div>
            {meal.suitability_score != null && <div className="w-full bg-sage rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full ${
                  meal.suitability_score >= 75 ? 'bg-lime' :
                  meal.suitability_score >= 50 ? 'bg-lime' :
                  'bg-forest'
                }`}
                style={{ width: `${Math.min(meal.suitability_score, 100)}%` }}
              />
            </div>}
          </div>
        </div>
      </div>

      {/* Nutritional Summary */}
      <div className="px-4 py-3 bg-mist grid grid-cols-4 gap-2 text-center text-sm">
        <div>
          <div className="font-semibold text-forest">{nutrition.calories ?? meal.calories ?? '-'}</div>
          <div className="text-xs text-forest/80">kcal</div>
        </div>
        <div>
          <div className="font-semibold text-forest">{nutrition.carbs_g ?? meal.carbs ?? '-'}</div>
          <div className="text-xs text-forest/80">carbs</div>
        </div>
        <div>
          <div className="font-semibold text-forest">{nutrition.protein_g ?? meal.protein ?? '-'}</div>
          <div className="text-xs text-forest/80">protein</div>
        </div>
        <div>
          <div className="font-semibold text-forest">{nutrition.fat_g ?? meal.fat ?? '-'}</div>
          <div className="text-xs text-forest/80">fat</div>
        </div>
      </div>

      {topModelFactors.length > 0 && (
        <div className="border-t border-sage px-4 py-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-forest">
            Why this was rated {meal.predicted_label}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {topModelFactors.map((factor: {
              feature: string;
              value: number;
              shap_contribution: number;
            }, index: number) => {
              const featureInfo = modelFeatureLabels[factor.feature];
              const featureLabel = featureInfo?.label ?? factor.feature.replace(/_/g, ' ');
              const direction = factor.shap_contribution > 0
                ? `Pushed the prediction toward ${meal.predicted_label}`
                : `Pulled the prediction away from ${meal.predicted_label}`;
              return (
                <li key={factor.feature} className="rounded-md bg-mist px-2.5 py-2 text-xs">
                  <p className="font-semibold text-forest">
                    {featureLabel}
                    {Number.isFinite(factor.value) && (
                      <span className="ml-1 font-normal text-forest/80">
                        ({formatModelFeatureValue(factor.feature, factor.value)})
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-forest/80">
                    {index === 0 ? 'Biggest influence: ' : ''}
                    {direction}.
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-forest/70">
            This explains the model’s pattern, not a medical judgment. Changing one
            value alone may not change the result.
          </p>
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="px-4 py-3 border-t border-sage">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest/70">Ingredients</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ingredients.map((ingredient, index) => {
              const { name, optional } = ingredient;
              const available = isIngredientInInventory(ingredient, inventoryItems);
              return (
                <span
                  key={ingredient.id ?? `${name}-${index}`}
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    available
                      ? 'border border-lime bg-lime font-semibold text-forest'
                      : optional
                        ? 'border border-dashed border-forest bg-mist text-forest'
                        : 'border border-sage bg-mist text-forest'
                  }`}
                  title={available ? 'You already have this' : optional ? 'Optional ingredient' : 'Not in your inventory'}
                >
                  {ingredient ? getLocalizedIngredientName(ingredient, foodLanguage) : name}
                  {available ? ' - You already have this' : optional ? ' (optional)' : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Inventory Status */}
      <div className="px-4 py-2 border-t border-sage">
        <div className={`text-sm font-medium ${inventoryStatus ? getInventoryColor() : 'text-forest/70'}`}>
          {getInventoryIcon()}
        </div>
      </div>

      {/* Safety Status */}
      {(meal.is_blocked || meal.rule_pass === false) && (
        <div className="px-4 py-2 bg-mist border-t border-sage">
          <div className="text-sm text-forest font-medium">
            ⚠ Blocked: {meal.block_reason || meal.rule_block_reason || 'Doesn\'t meet safety requirements'}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-sage flex gap-2">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-lime hover:bg-lime/90 text-forest font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          View Details
          <ChevronRight size={16} />
        </button>
        <button
          onClick={onSubstitute}
          className="px-3 py-2 border border-sage hover:border-forest/40 hover:bg-mist text-forest font-semibold rounded-lg transition-colors"
          title="Find ingredient substitutes"
        >
          Substitute
        </button>
        {onAddToPlan && (
          <button
            onClick={onAddToPlan}
            className="px-3 py-2 border border-sage hover:border-forest/40 hover:bg-mist text-forest font-semibold rounded-lg transition-colors"
            title="Add to meal plan"
          >
            Plan
          </button>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;
