import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecommendationStore, useAuthStore } from '../store';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import toast from 'react-hot-toast';
import { Loader, Filter } from 'lucide-react';
import RecommendationCard from '../components/RecommendationCard';
import { useInventoryStore } from '../store';
import { getMealIngredients, getMealInventoryStatus } from '../utils/mealIngredients';

type RecommendationCategory = 'recommended' | 'moderate' | 'blocked';

export const GenerateMealPrep: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { items: inventoryItems, setItems } = useInventoryStore();
  const {
    setRecommendations,
    setCurrentRecommendation,
    recommendations,
    isLoading,
    setLoading,
  } = useRecommendationStore();
  const [selectedCategory, setSelectedCategory] = useState<RecommendationCategory>('recommended');
  const [showAll, setShowAll] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'inventory'>('score');
  const [searchQuery, setSearchQuery] = useState('');
  const [carbsRange, setCarbsRange] = useState({ min: '', max: '' });
  const [proteinRange, setProteinRange] = useState({ min: '', max: '' });
  const [favoriteIds, setFavoriteIds] = useState<Record<string, number>>({});

  React.useEffect(() => {
    apiClient.getInventory()
      .then(({ data }) => setItems(data))
      .catch((error: unknown) => {
        toast.error(getApiErrorMessage(error, 'Failed to load household inventory'));
      });

    apiClient.getFavorites()
      .then(({ data }) => {
        setFavoriteIds(Object.fromEntries(
          data.map((favorite: { food_id: string; id: number }) => [favorite.food_id, favorite.id])
        ));
      })
      .catch((error: unknown) => {
        toast.error(getApiErrorMessage(error, 'Failed to load favorite status'));
      });
  }, []);

  const handleGenerateRecommendations = async () => {
    if (!profile) {
      toast.error('Please set up your profile first');
      navigate('/profile');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.getAllRecommendations('xgboost');
      setRecommendations(res.data);
      toast.success(`Generated ${res.data.recommended?.length || 0} recommendations`);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to generate recommendations'));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecommendations = () => {
    if (!recommendations) return [];
    
    let meals = showAll
      ? [
          ...(recommendations.recommended || []),
          ...(recommendations.moderate || []),
          ...(recommendations.rejected || []),
        ]
      : [...(recommendations[selectedCategory === 'blocked' ? 'rejected' : selectedCategory] || [])];

    const keywordGroups = searchQuery
      .split(/,|\bOR\b/i)
      .map((group) => group
        .split(/\bAND\b/i)
        .map((term) => term.trim().toLocaleLowerCase())
        .filter(Boolean))
      .filter((group) => group.length > 0);
    if (keywordGroups.length > 0) {
      meals = meals.filter((meal) => {
        const ingredients = getMealIngredients(meal);
        const searchableText = [
          meal.food_name,
          meal.food_name_sinhala,
          meal.food_name_tamil,
          ...ingredients.flatMap((ingredient) => [
            ingredient.name,
            ingredient.sinhalaName,
            ingredient.tamilName,
            ...(ingredient.aliases ?? []),
          ]),
        ]
          .filter((value): value is string => typeof value === 'string')
          .join(' ')
          .toLocaleLowerCase();
        return keywordGroups.some((group) =>
          group.every((term) => searchableText.includes(term)),
        );
      });
    }

    const withinRange = (value: unknown, range: { min: string; max: string }) => {
      const minimum = range.min === '' ? undefined : Number(range.min);
      const maximum = range.max === '' ? undefined : Number(range.max);
      if (value == null || !Number.isFinite(Number(value))) return false;
      const amount = Number(value);
      return (minimum === undefined || amount >= minimum)
        && (maximum === undefined || amount <= maximum);
    };

    if (carbsRange.min !== '' || carbsRange.max !== '') {
      meals = meals.filter((meal) =>
        withinRange(meal.nutritional_summary?.carbs_g ?? meal.carbs, carbsRange),
      );
    }
    if (proteinRange.min !== '' || proteinRange.max !== '') {
      meals = meals.filter((meal) =>
        withinRange(meal.nutritional_summary?.protein_g ?? meal.protein, proteinRange),
      );
    }

    // Sort
    switch (sortBy) {
      case 'score':
        return meals.sort((a, b) => (b.suitability_score || 0) - (a.suitability_score || 0));
      case 'name':
        return meals.sort((a, b) => (a.food_name || '').localeCompare(b.food_name || ''));
      case 'inventory':
        return meals.sort((a, b) => {
          const statusOrder = { all: 0, partial: 1, missing: 2, unknown: 3 };
          const getStatus = (meal: typeof a) =>
            getMealInventoryStatus(getMealIngredients(meal), inventoryItems) ?? 'unknown';
          return statusOrder[getStatus(a)] - statusOrder[getStatus(b)];
        });
      default:
        return meals;
    }
  };

  const keywordSuggestions = React.useMemo(() => {
    if (!recommendations) return [];
    const suggestionQuery = searchQuery
      .split(/,|\bOR\b|\bAND\b/i)
      .pop()
      ?.trim()
      .toLocaleLowerCase() || '';
    if (!suggestionQuery) return [];

    const allMeals = [
      ...(recommendations.recommended || []),
      ...(recommendations.moderate || []),
      ...(recommendations.rejected || []),
    ];
    return [...new Set(allMeals.flatMap((meal) => [
      meal.food_name,
      meal.food_name_sinhala,
      meal.food_name_tamil,
      ...getMealIngredients(meal).flatMap((ingredient) => [
        ingredient.name,
        ingredient.sinhalaName,
        ingredient.tamilName,
        ...(ingredient.aliases ?? []),
      ]),
    ]).filter((value): value is string => typeof value === 'string' && value.trim().length > 0))]
      .filter((suggestion) => suggestion.toLocaleLowerCase().includes(suggestionQuery))
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 12);
  }, [recommendations, searchQuery]);

  const filteredMeals = getFilteredRecommendations();

  return (
    <div className="min-h-screen bg-mist p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest">Generate XAI Meal Prep</h1>
          <p className="text-forest/80 mt-1">Get personalized meal recommendations based on your dietary condition</p>
        </div>

        {/* Control Panel */}
        <div className="bg-sage rounded-lg border border-sage p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label>
              <span className="mb-2 block text-sm font-semibold text-forest">Ingredients or meal keywords</span>
              <input
                type="search"
                list="meal-keyword-suggestions"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleGenerateRecommendations();
                  }
                }}
                placeholder="e.g. tomato, curry, dhal, salad, coconut"
                aria-label="Search meal ingredients or keywords"
                className="w-full rounded-lg border border-sage px-4 py-2 focus:outline-none focus:ring-2 focus:ring-forest/40"
              />
              <datalist id="meal-keyword-suggestions">
                {keywordSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              <span className="mt-1 block text-xs text-forest/70">
                Enter comma-separated keywords to show matching meals. Leave blank to browse all.
              </span>
            </label>

            <div className="self-start md:mt-[1.875rem]">
              <button
                onClick={handleGenerateRecommendations}
                disabled={isLoading}
                className="w-full min-h-[42px] bg-lime hover:bg-lime/90 disabled:bg-sage text-forest font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader className="animate-spin" size={16} />}
                Generate Recommendations
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {recommendations && (
            <div className="space-y-4 pt-4 border-t border-sage">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-forest">Carbohydrates (g)</legend>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={carbsRange.min}
                      onChange={(event) => setCarbsRange((range) => ({ ...range, min: event.target.value }))}
                      placeholder="Min"
                      aria-label="Minimum carbohydrates in grams"
                      className="w-full rounded-lg border border-sage px-3 py-2"
                    />
                    <input
                      type="number"
                      min="0"
                      value={carbsRange.max}
                      onChange={(event) => setCarbsRange((range) => ({ ...range, max: event.target.value }))}
                      placeholder="Max"
                      aria-label="Maximum carbohydrates in grams"
                      className="w-full rounded-lg border border-sage px-3 py-2"
                    />
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-forest">Protein (g)</legend>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={proteinRange.min}
                      onChange={(event) => setProteinRange((range) => ({ ...range, min: event.target.value }))}
                      placeholder="Min"
                      aria-label="Minimum protein in grams"
                      className="w-full rounded-lg border border-sage px-3 py-2"
                    />
                    <input
                      type="number"
                      min="0"
                      value={proteinRange.max}
                      onChange={(event) => setProteinRange((range) => ({ ...range, max: event.target.value }))}
                      placeholder="Max"
                      aria-label="Maximum protein in grams"
                      className="w-full rounded-lg border border-sage px-3 py-2"
                    />
                  </div>
                </fieldset>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-forest/80" />
                  <span className="text-sm font-semibold text-forest">Sort by:</span>
                </div>
                {([
                  ['score', 'Score'],
                  ['name', 'Name'],
                  ['inventory', 'Inventory'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                      sortBy === value
                        ? 'bg-lime text-forest'
                        : 'bg-sage text-forest hover:bg-sage/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <label className="ml-auto flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAll}
                    onChange={(e) => setShowAll(e.target.checked)}
                    className="w-4 h-4 rounded border-sage"
                  />
                  <span className="text-sm font-semibold text-forest">Show all</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-forest/70" size={32} />
            <span className="ml-3 text-forest/80">Generating recommendations...</span>
          </div>
        ) : recommendations ? (
          <div>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
              <button
                type="button"
                aria-pressed={!showAll && selectedCategory === 'recommended'}
                onClick={() => {
                  setSelectedCategory('recommended');
                  setShowAll(false);
                }}
                className={`text-left bg-mist border rounded-lg p-4 transition ring-offset-2 hover:ring-2 hover:ring-sage ${
                  !showAll && selectedCategory === 'recommended' ? 'border-forest/40 ring-2 ring-forest/40' : 'border-sage'
                }`}
              >
                <div className="text-2xl font-bold text-forest">{recommendations.recommended?.length || 0}</div>
                <div className="text-sm text-forest/80">Recommended</div>
              </button>
              <button
                type="button"
                aria-pressed={!showAll && selectedCategory === 'moderate'}
                onClick={() => {
                  setSelectedCategory('moderate');
                  setShowAll(false);
                }}
                className={`text-left bg-mist border rounded-lg p-4 transition ring-offset-2 hover:ring-2 hover:ring-sage ${
                  !showAll && selectedCategory === 'moderate' ? 'border-forest/40 ring-2 ring-forest/40' : 'border-sage'
                }`}
              >
                <div className="text-2xl font-bold text-forest">{recommendations.moderate?.length || 0}</div>
                <div className="text-sm text-forest/80">Moderate</div>
              </button>
              <button
                type="button"
                aria-pressed={!showAll && selectedCategory === 'blocked'}
                onClick={() => {
                  setSelectedCategory('blocked');
                  setShowAll(false);
                }}
                className={`text-left bg-mist border rounded-lg p-4 transition ring-offset-2 hover:ring-2 hover:ring-sage ${
                  !showAll && selectedCategory === 'blocked' ? 'border-forest/40 ring-2 ring-forest/40' : 'border-sage'
                }`}
              >
                <div className="text-2xl font-bold text-forest">{recommendations.rejected?.length || 0}</div>
                <div className="text-sm text-forest/80">Blocked</div>
              </button>
            </div>

            {/* Meals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMeals.map((meal, index) => (
                <RecommendationCard
                  key={meal.food_id ?? meal.id ?? `${meal.food_name}-${index}`}
                  meal={meal}
                  isFavorite={Boolean(favoriteIds[meal.food_id])}
                  inventoryItems={inventoryItems}
                  onViewDetails={() => {
                    setCurrentRecommendation(meal);
                    navigate(`/meal/${encodeURIComponent(meal.food_id)}`);
                  }}
                  onAddFavorite={async () => {
                    try {
                      const favoriteId = favoriteIds[meal.food_id];
                      if (favoriteId) {
                        await apiClient.deleteFavorite(favoriteId);
                        setFavoriteIds((current) => {
                          const updated = { ...current };
                          delete updated[meal.food_id];
                          return updated;
                        });
                        toast.success('Removed from favorites');
                      } else {
                        const { data } = await apiClient.addFavorite(meal.food_id, meal.food_name, 5);
                        setFavoriteIds((current) => ({ ...current, [meal.food_id]: data.id }));
                        toast.success('Added to favorites');
                      }
                    } catch (error: unknown) {
                      toast.error(getApiErrorMessage(error, 'Failed to update favorites'));
                    }
                  }}
                  onSubstitute={() => {
                    navigate('/substitutions', { state: { foodId: meal.food_id } });
                  }}
                  onAddToPlan={() => {
                    toast.success('Added to meal plan (coming soon)');
                  }}
                />
              ))}
            </div>

            {filteredMeals.length === 0 && (
              <div className="bg-sage rounded-lg border border-sage p-12 text-center">
                <p className="text-forest/80 text-lg">No meals found with current filters.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-sage rounded-lg border border-sage p-12 text-center">
            <p className="text-forest/80 text-lg mb-4">Click "Generate Recommendations" to start</p>
            <p className="text-forest/70">Recommendations will be personalized based on your dietary condition and household inventory</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateMealPrep;
