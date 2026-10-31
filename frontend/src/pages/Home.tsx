import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Heart, Cpu, TrendingUp, Calendar } from 'lucide-react';
import logo from '../assets/logo.png';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-mist via-mist to-sage">
      {/* Header Navigation */}
      <nav className="bg-mist border-b border-sage">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="h-10 w-24 overflow-hidden sm:h-12 sm:w-36">
            <img
              src={logo}
              alt="DAINE"
              className="h-full w-full object-cover"
              style={{ objectPosition: 'center 49%' }}
            />
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/generate-meal-prep')}
                  className="bg-lime hover:bg-lime/90 text-ink font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Get Recommendations
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-ink hover:text-ink/80 font-semibold py-2 px-6 transition-colors"
                >
                  Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signin')}
                  className="text-ink hover:text-ink/80 font-semibold py-2 px-6 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-lime hover:bg-lime/90 text-ink font-semibold py-2 px-6 rounded-lg transition-colors"
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
          <h2 className="text-5xl font-bold text-ink mb-4">
            Explainable AI Dietary Recommendations
          </h2>
          <p className="text-xl text-ink/80 mb-8">
            Get personalized meal recommendations based on your health condition with full AI explanations
          </p>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/signup')}
              className="rounded-full border-b-[6px] border-[#487935] bg-lime px-8 py-3 text-lg font-extrabold uppercase tracking-wide text-ink shadow-[0_8px_18px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-1 hover:bg-lime/95 active:translate-y-1 active:border-b-2"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-sage rounded-lg p-6 border border-sage hover:shadow-lg transition-shadow">
            <Heart className="text-forest/70 mb-3" size={32} />
            <h3 className="font-bold text-ink mb-2">Personalized Health</h3>
            <p className="text-sm text-ink/80">
              AI learns your dietary condition: diabetes, hypertension, cardiovascular, or weight management
            </p>
          </div>

          <div className="bg-sage rounded-lg p-6 border border-sage hover:shadow-lg transition-shadow">
            <Cpu className="text-forest/70 mb-3" size={32} />
            <h3 className="font-bold text-ink mb-2">Explainable AI</h3>
            <p className="text-sm text-ink/80">
              See exactly why each meal is recommended with SHAP feature importance analysis
            </p>
          </div>

          <div className="bg-sage rounded-lg p-6 border border-sage hover:shadow-lg transition-shadow">
            <TrendingUp className="text-forest/70 mb-3" size={32} />
            <h3 className="font-bold text-ink mb-2">What-If Analysis</h3>
            <p className="text-sm text-ink/80">
              Modify ingredients and instantly see how it impacts your health score
            </p>
          </div>

          <div className="bg-sage rounded-lg p-6 border border-sage hover:shadow-lg transition-shadow">
            <Calendar className="text-forest/70 mb-3" size={32} />
            <h3 className="font-bold text-ink mb-2">Meal Planning</h3>
            <p className="text-sm text-ink/80">
              Generate personalized daily and weekly meal plans based on your inventory
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-sage rounded-lg border border-sage p-8 mb-16">
          <h3 className="text-2xl font-bold text-ink mb-8 text-center">How It Works</h3>
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
                <div className="w-12 h-12 bg-lime text-ink rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {step.number}
                </div>
                <h4 className="font-bold text-ink mb-2">{step.title}</h4>
                <p className="text-sm text-ink/80">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="bg-sage rounded-lg p-12 text-center text-ink">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Diet?</h3>
            <p className="text-lg mb-8 opacity-90">
              Join DAINE today and get AI-powered meal recommendations backed by science
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="bg-mist hover:bg-white text-ink font-bold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Create Free Account
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-sage text-ink py-8 mt-16">
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
