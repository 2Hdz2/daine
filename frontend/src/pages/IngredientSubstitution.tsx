import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import toast from 'react-hot-toast';
import { Loader, ArrowLeft } from 'lucide-react';
import ScoreDisplay from '../components/ScoreDisplay';

export const IngredientSubstitution: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const foodId = location.state?.foodId;

  const [ingredient, setIngredient] = useState('');
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  const [selectedSubstitute, setSelectedSubstitute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleSearchSubstitutes = async () => {
    if (!ingredient) {
      toast.error('Please enter an ingredient');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.findSubstitutes(ingredient);
      setSubstitutes(res.data);
      if (res.data.length === 0) {
        toast('No substitutes found for this ingredient');
      } else {
        toast.success(`Found ${res.data.length} substitutes`);
      }
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to find substitutes'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateSubstitution = async (substitute: any) => {
    setIsEvaluating(true);
    try {
      const res = await apiClient.evaluateSubstitution(
        foodId,
        ingredient,
        substitute.name
      );
      setSelectedSubstitute(res.data);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to evaluate substitution'));
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-forest/70 hover:text-forest/80 font-semibold mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest">Ingredient Substitution</h1>
          <p className="text-forest/80 mt-2">Find healthier or more compatible ingredient alternatives</p>
        </div>

        {/* Search Form */}
        <div className="bg-sage rounded-lg border border-sage p-6 mb-8">
          <h2 className="text-xl font-bold text-forest mb-4">Find Substitutes</h2>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              placeholder="E.g., 'butter', 'sugar', 'white rice'"
              className="flex-1 px-4 py-2 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
            />
            <button
              onClick={handleSearchSubstitutes}
              disabled={isLoading}
              className="bg-lime hover:bg-lime/90 disabled:bg-sage text-forest font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader className="animate-spin" size={16} />}
              Search
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Substitutes List */}
          {substitutes.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-sage rounded-lg border border-sage p-6">
                <h3 className="font-bold text-forest mb-4">
                  Available Substitutes ({substitutes.length})
                </h3>
                <div className="space-y-2">
                  {substitutes.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEvaluateSubstitution(sub)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSubstitute?.name === sub.name
                          ? 'border-forest/40 bg-mist'
                          : 'border-sage hover:border-sage'
                      }`}
                    >
                      <div className="font-semibold text-forest">{sub.name}</div>
                      <div className="text-xs text-forest/80 mt-1">
                        Score: {Math.round(sub.score * 100)}/100
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Details */}
          {selectedSubstitute && !isEvaluating && (
            <div className="lg:col-span-2">
              <div className="bg-sage rounded-lg border border-sage p-6">
                <h3 className="text-xl font-bold text-forest mb-6">
                  Substitution: {ingredient} → {selectedSubstitute.name}
                </h3>

                {/* Score Comparison */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <ScoreDisplay
                      score={selectedSubstitute.original_score}
                      label="Original"
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-2xl font-bold text-forest/50">→</div>
                  </div>
                  <div className="text-center">
                    <ScoreDisplay
                      score={selectedSubstitute.substitute_score}
                      label="Substitute"
                      size="sm"
                    />
                  </div>
                </div>

                {/* Nutritional Comparison */}
                {selectedSubstitute.nutritional_changes && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-forest mb-3">Nutritional Changes</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedSubstitute.nutritional_changes).map(([nutrient, change]: [string, any]) => (
                        <div key={nutrient} className="flex items-center justify-between p-2 bg-mist rounded">
                          <span className="text-sm text-forest capitalize">
                            {nutrient.replace(/_/g, ' ')}
                          </span>
                          <span className={`font-semibold ${
                            change > 0 ? 'text-forest/80' :
                            change < 0 ? 'text-forest/80' :
                            'text-forest/80'
                          }`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compatibility Note */}
                <div className={`p-4 rounded-lg mb-6 ${
                  selectedSubstitute.is_compatible
                    ? 'bg-mist border border-sage'
                    : 'bg-mist border border-sage'
                }`}>
                  <p className={`font-semibold ${
                    selectedSubstitute.is_compatible
                      ? 'text-forest'
                      : 'text-forest'
                  }`}>
                    {selectedSubstitute.is_compatible
                      ? '✓ Recommended Substitution'
                      : '⚠ Proceed with Caution'
                    }
                  </p>
                  <p className={`text-sm mt-1 ${
                    selectedSubstitute.is_compatible
                      ? 'text-forest'
                      : 'text-forest'
                  }`}>
                    {selectedSubstitute.recommendation}
                  </p>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={() => {
                    toast.success(`Substitution applied: ${ingredient} → ${selectedSubstitute.name}`);
                    navigate('/generate-meal-prep');
                  }}
                  className="w-full bg-lime hover:bg-lime/90 text-forest font-semibold py-3 rounded-lg transition-colors"
                >
                  Apply Substitution
                </button>
              </div>
            </div>
          )}

          {isEvaluating && (
            <div className="lg:col-span-2 flex items-center justify-center">
              <Loader className="animate-spin text-forest/70" size={32} />
            </div>
          )}

          {substitutes.length === 0 && !isLoading && ingredient && (
            <div className="lg:col-span-2 bg-sage rounded-lg border border-sage p-12 text-center">
              <p className="text-forest/80">No substitutes found for "{ingredient}"</p>
              <p className="text-forest/70 text-sm mt-2">Try a different ingredient</p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-mist border border-sage rounded-lg p-6">
          <h3 className="font-bold text-forest mb-2">Substitution Tips</h3>
          <ul className="text-sm text-forest space-y-1">
            <li>✓ Consider both nutritional and taste implications</li>
            <li>✓ High compatibility scores mean better health alignment</li>
            <li>✓ Some substitutes maintain better texture or flavor</li>
            <li>✓ Always consider your dietary condition requirements</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IngredientSubstitution;
