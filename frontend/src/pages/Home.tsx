import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Heart, Cpu, TrendingUp, Calendar } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-mist via-mist to-sage">
      {/* Header Navigation */}
      <nav className="bg-mist border-b border-sage">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-forest/80">DAINE</h1>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/generate-meal-prep')}
                  className="bg-forest hover:bg-forest/90 text-mist font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Get Recommendations
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-forest hover:text-forest/80 font-semibold py-2 px-6 transition-colors"
                >
                  Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signin')}
                  className="text-forest hover:text-forest/80 font-semibold py-2 px-6 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-forest hover:bg-forest/90 text-mist font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-forest mb-4">
            Explainable AI Dietary Recommendations
          </h2>
          <p className="text-xl text-forest/80 mb-8">
            Get personalized meal recommendations based on your health condition with full AI explanations
          </p>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/signup')}
              className="bg-forest hover:bg-forest/90 text-mist font-bold py-4 px-8 rounded-lg text-lg transition-colors"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-sage rounded-lg p-6 border border-sage hover:shadow-lg transition-shadow">
            <Heart className="text-forest/70 mb-3" size={32} />
            <h3 className="font-bold text-forest mb-2">Personalized Health</h3>
            <p className="text-sm text-forest/80">
              AI learns your dietary condition: diabetes, hypertension, cardiovascular, or weight management
            </p>
          </div>

          <div className="bg-sage rounded-lg p-6 border border-sage hover:shadow-lg transition-shadow">
            <Cpu className="text-forest/70 mb-3" size={32} />
            <h3 className="font-bold text-forest mb-2">Explainable AI</h3>
            <p className="text-sm text-forest/80">
              See exactly why each meal is recommended with SHAP feature importance analysis
            </p>
          </div>

          <div className="bg-sage rounded-lg p-6 border border-sage hover:shadow-lg transition-shadow">
            <TrendingUp className="text-forest/70 mb-3" size={32} />
            <h3 className="font-bold text-forest mb-2">What-If Analysis</h3>
            <p className="text-sm text-forest/80">
              Modify ingredients and instantly see how it impacts your health score
            </p>
          </div>

          <div className="bg-sage rounded-lg p-6 border border-sage hover:shadow-lg transition-shadow">
            <Calendar className="text-forest/70 mb-3" size={32} />
            <h3 className="font-bold text-forest mb-2">Meal Planning</h3>
            <p className="text-sm text-forest/80">
              Generate personalized daily and weekly meal plans based on your inventory
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-sage rounded-lg border border-sage p-8 mb-16">
          <h3 className="text-2xl font-bold text-forest mb-8 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                number: '1',
                title: 'Set Profile',
                description: 'Tell us your dietary condition and preferences'
              },
              {
                number: '2',
                title: 'Add Inventory',
                description: 'List foods you have available at home'
              },
              {
                number: '3',
                title: 'Get Recommendations',
                description: 'AI recommends meals tailored to your health'
              },
              {
                number: '4',
                title: 'Understand Why',
                description: 'See full AI explanations for each recommendation'
              }
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-forest text-mist rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {step.number}
                </div>
                <h4 className="font-bold text-forest mb-2">{step.title}</h4>
                <p className="text-sm text-forest/80">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-forest to-forest rounded-lg p-12 text-center text-mist">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Diet?</h3>
            <p className="text-lg mb-8 opacity-90">
              Join DAINE today and get AI-powered meal recommendations backed by science
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="bg-mist hover:bg-sage/80 text-forest/80 font-bold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Create Free Account
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-forest text-mist py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>DAINE - Explainable AI Dietary Decision-Support System</p>
          <p className="text-sm mt-2">
            Always consult with healthcare professionals before making dietary changes
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
