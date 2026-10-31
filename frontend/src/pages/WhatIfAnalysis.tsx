import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import toast from 'react-hot-toast';
import { Loader, ArrowLeft } from 'lucide-react';
import ScoreDisplay from '../components/ScoreDisplay';
import SHAPVisualization from '../components/SHAPVisualization';

export const WhatIfAnalysis: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const foodId = location.state?.foodId;

  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [modifiedFeatures, setModifiedFeatures] = useState<Record<string, number>>({});

  const features = [
    { key: 'carbs_g', label: 'Carbs (g)', unit: 'g' },
    { key: 'protein_g', label: 'Protein (g)', unit: 'g' },
    { key: 'fat_g', label: 'Fat (g)', unit: 'g' },
    { key: 'saturated_fat_g', label: 'Saturated Fat (g)', unit: 'g' },
    { key: 'fiber_g', label: 'Fiber (g)', unit: 'g' },
    { key: 'sodium_mg', label: 'Sodium (mg)', unit: 'mg' },
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'gi_score', label: 'GI Score', unit: 'score' },
  ];

  const handleAnalyze = async () => {
    if (!foodId) {
      toast.error('Food ID is required');
      return;
    }

    if (!description) {
      toast.error('Please describe the modification');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.analyzeWhatIf(foodId, description, modifiedFeatures);
      setAnalysis(res.data);
      toast.success('Analysis complete!');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Analysis failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreChangeColor = (change: number) => {
    if (change > 0) return 'text-forest/80 bg-mist';
    if (change < 0) return 'text-forest/80 bg-mist';
    return 'text-forest/80 bg-mist';
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
          <h1 className="text-3xl font-bold text-forest">What-If Analysis</h1>
          <p className="text-forest/80 mt-2">See how modifying ingredients affects your score</p>
        </div>

        {/* Input Form */}
        <div className="bg-sage rounded-lg border border-sage p-6 mb-8">
          <h2 className="text-xl font-bold text-forest mb-4">Modify Ingredients</h2>
          
          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-forest mb-2">
              Describe your modification
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., 'reduce sodium by 30%' or 'use low-fat version'"
              className="w-full px-4 py-2 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
            />
          </div>

          {/* Feature Modifications */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-forest mb-3">
              Feature Adjustments (optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map(feature => (
                <div key={feature.key}>
                  <label className="text-sm text-forest mb-1 block">
                    {feature.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={modifiedFeatures[feature.key] || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setModifiedFeatures((current) => {
                          if (!value) {
                            const next = { ...current };
                            delete next[feature.key];
                            return next;
                          }
                          return { ...current, [feature.key]: parseFloat(value) };
                        });
                      }}
                      placeholder="New value"
                      className="flex-1 px-3 py-2 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40 text-sm"
                    />
                    <span className="text-xs text-forest/80">{feature.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !foodId || !description}
            className="w-full bg-lime hover:bg-lime/90 disabled:bg-sage text-forest font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader className="animate-spin" size={18} />}
            {isLoading ? 'Analyzing...' : 'Analyze What-If'}
          </button>
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Score Comparison */}
            <div className="bg-sage rounded-lg border border-sage p-6">
              <h2 className="text-xl font-bold text-forest mb-6">Score Impact</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Original Score */}
                <div>
                  <p className="text-sm text-forest/80 mb-3">Original Score</p>
                  <ScoreDisplay
                    score={analysis.original_score}
                    label="Original"
                    size="sm"
                  />
                </div>

                {/* Score Change */}
                <div className="flex items-center justify-center">
                  <div className={`text-center p-4 rounded-lg ${getScoreChangeColor(analysis.score_change)}`}>
                    <div className="text-3xl font-bold">
                      {analysis.score_change > 0 ? '+' : ''}{analysis.score_change.toFixed(1)}
                    </div>
                    <div className="text-sm font-semibold">Score Change</div>
                    {analysis.improved && (
                      <div className="text-xs mt-1">✓ Improved!</div>
                    )}
                  </div>
                </div>

                {/* Modified Score */}
                <div>
                  <p className="text-sm text-forest/80 mb-3">New Score</p>
                  <ScoreDisplay
                    score={analysis.modified_score}
                    label="Modified"
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Feature Changes */}
            {analysis.feature_changes && Object.keys(analysis.feature_changes).length > 0 && (
              <div className="bg-sage rounded-lg border border-sage p-6">
                <h3 className="text-lg font-bold text-forest mb-4">Feature Changes</h3>
                <div className="space-y-3">
                  {Object.entries(analysis.feature_changes).map(([feature, change]: [string, any]) => (
                    <div key={feature} className="flex items-center justify-between p-3 bg-sage rounded-lg">
                      <span className="font-semibold text-forest capitalize">
                        {feature.replace(/_/g, ' ')}
                      </span>
                      <span className={`font-bold ${
                        change > 0 ? 'text-forest/80' :
                        change < 0 ? 'text-forest/80' :
                        'text-forest/80'
                      }`}>
                        {change > 0 ? '+' : ''}{change.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHAP Changes */}
            {analysis.shap_changes && (
              <div className="bg-sage rounded-lg border border-sage p-6">
                <h3 className="text-lg font-bold text-forest mb-4">SHAP Impact Changes</h3>
                <SHAPVisualization
                  contributions={analysis.shap_changes}
                />
              </div>
            )}

            {/* Recommendation */}
            <div className="bg-mist border border-sage rounded-lg p-6">
              <h3 className="font-bold text-forest mb-2">Recommendation</h3>
              <p className="text-forest text-sm">
                {analysis.improved 
                  ? `Great! This modification improves the suitability score by ${analysis.score_change.toFixed(1)} points.`
                  : `This modification would ${analysis.score_change > 0 ? 'improve' : 'reduce'} the score by ${Math.abs(analysis.score_change).toFixed(1)} points.`
                }
              </p>
              <button
                onClick={() => toast.success('Added to meal plan (coming soon)')}
                className="mt-4 bg-lime hover:bg-lime/90 text-forest font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Apply to Meal Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatIfAnalysis;
