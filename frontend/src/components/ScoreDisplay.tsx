import React from 'react';

interface ScoreDisplayProps {
  score: number;
  label: string;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
  score, 
  label, 
  confidence,
  size = 'md' 
}) => {
  const getColor = () => {
    if (score >= 75) return 'bg-sage border-forest/40';
    if (score >= 50) return 'bg-sage border-forest/40';
    return 'bg-sage border-forest/40';
  };

  const getTextColor = () => {
    if (score >= 75) return 'text-forest';
    if (score >= 50) return 'text-forest';
    return 'text-forest';
  };

  const sizes = {
    sm: 'w-24 h-24 text-2xl',
    md: 'w-32 h-32 text-4xl',
    lg: 'w-40 h-40 text-5xl',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} ${getColor()} border-4 rounded-full flex items-center justify-center relative`}>
        <div className={`${getTextColor()} font-bold`}>
          {Math.round(score)}
        </div>
        <div className="absolute bottom-2 text-xs text-forest/80">out of 100</div>
      </div>
      <div className={`text-center ${getTextColor()} font-semibold`}>
        {label}
      </div>
      {confidence && (
        <div className="text-xs text-forest/80">
          Confidence: {Math.round(confidence * 100)}%
        </div>
      )}
      <div className="w-full bg-sage rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${
            score >= 75 ? 'bg-forest' :
            score >= 50 ? 'bg-forest' :
            'bg-forest'
          }`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ScoreDisplay;
