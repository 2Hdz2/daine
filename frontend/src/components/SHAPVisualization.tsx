import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SHAPContribution {
  feature: string;
  value?: number;
  shap_contribution: number;
}

interface SHAPVisualizationProps {
  contributions: SHAPContribution[] | Record<string, number>;
}

export const SHAPVisualization: React.FC<SHAPVisualizationProps> = ({ contributions }) => {
  const contributionList: SHAPContribution[] = Array.isArray(contributions)
    ? contributions
    : Object.entries(contributions || {}).map(([feature, shap_contribution]) => ({
        feature,
        shap_contribution,
      }));
  const sortedContributions = [...contributionList].sort((a, b) => 
    Math.abs(b.shap_contribution) - Math.abs(a.shap_contribution)
  );

  const positiveFactors = sortedContributions.filter(c => c.shap_contribution > 0);
  const negativeFactors = sortedContributions.filter(c => c.shap_contribution < 0);

  return (
    <div className="space-y-6">
      <div className="bg-sage p-4 rounded-lg border border-sage">
        <h3 className="font-semibold text-forest mb-2">How the Model Arrived at Its Prediction</h3>
        <p className="text-sm text-forest/80">
          SHAP values show how each feature influenced the model's predicted class.
          Positive values support that class; negative values pull against it.
          They are model-output contributions, not points added to the suitability score.
        </p>
      </div>

      {/* SHAP Contributions Chart */}
      <div className="bg-sage p-4 rounded-lg border border-sage">
        <h3 className="font-semibold text-forest mb-4">Feature Impact Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedContributions} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#B7D7B0" strokeDasharray="3 3" />
            <XAxis 
              dataKey="feature" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 12, fill: '#355E3B' }}
              stroke="#355E3B"
            />
            <YAxis
              label={{ value: 'SHAP Value', angle: -90, position: 'insideLeft', fill: '#355E3B' }}
              tick={{ fill: '#355E3B' }}
              stroke="#355E3B"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#F0F7EE', borderColor: '#B7D7B0', color: '#355E3B' }}
              formatter={(value: number) => value.toFixed(3)}
              labelFormatter={(label) => `Feature: ${label}`}
            />
            <Bar 
              dataKey="shap_contribution" 
              fill="#355E3B"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Positive Factors */}
      {positiveFactors.length > 0 && (
        <div className="bg-sage p-4 rounded-lg border border-sage">
          <h4 className="font-semibold text-forest mb-3">✓ Positive Factors</h4>
          <ul className="space-y-2">
            {positiveFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-forest/80 font-bold mt-0.5">+</span>
                <div className="flex-1">
                  <div className="font-medium text-forest">{factor.feature}</div>
                  <div className="text-forest/80 text-xs">
                    {Number.isFinite(factor.value) && `Value: ${factor.value?.toFixed(2)} | `}
                    SHAP contribution: +{factor.shap_contribution.toFixed(3)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Negative Factors */}
      {negativeFactors.length > 0 && (
        <div className="bg-sage p-4 rounded-lg border border-sage">
          <h4 className="font-semibold text-forest mb-3">✗ Negative Factors</h4>
          <ul className="space-y-2">
            {negativeFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-forest/80 font-bold mt-0.5">−</span>
                <div className="flex-1">
                  <div className="font-medium text-forest">{factor.feature}</div>
                  <div className="text-forest/80 text-xs">
                    {Number.isFinite(factor.value) && `Value: ${factor.value?.toFixed(2)} | `}
                    SHAP contribution: {factor.shap_contribution.toFixed(3)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Notes */}
      <div className="bg-sage p-4 rounded-lg border border-sage">
        <h4 className="font-semibold text-forest mb-2">Safety Rules Applied</h4>
        <p className="text-sm text-forest">
          All recommendations respect your dietary condition safety constraints. 
          If a meal is blocked, it failed one of the hard safety rules for your condition.
        </p>
      </div>
    </div>
  );
};

export default SHAPVisualization;
