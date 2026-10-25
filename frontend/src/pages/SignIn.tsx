import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import toast from 'react-hot-toast';
import { Home, Mail, Lock, Loader } from 'lucide-react';

export const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await apiClient.login(formData.email, formData.password);
      const token = res.data.access_token;
      apiClient.setAuthHeader(token);
      const user = await apiClient.getCurrentUser();
      setUser(user.data);
      setToken(token);
      
      if (rememberMe) {
        localStorage.setItem('rememberEmail', formData.email);
      }
      
      toast.success('Logged in successfully!');
      navigate('/generate-meal-prep');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail');
    if (savedEmail) {
      setFormData({ ...formData, email: savedEmail });
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mist to-sage flex items-center justify-center p-4">
      <div className="bg-sage rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex justify-start">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Go to home page"
            className="inline-flex items-center gap-2 rounded-lg border border-forest px-3 py-2 text-sm font-semibold text-forest transition-colors hover:bg-sage/80"
          >
            <Home size={18} />
            Home
          </button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-forest">Welcome Back</h1>
          <p className="text-forest/80 mt-2">Sign in to your DAINE account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-forest mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-forest/50" size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40 ${
                  errors.email ? 'border-forest/40' : 'border-sage'
                }`}
                placeholder="your@email.com"
              />
            </div>
            {errors.email && <p className="text-forest/80 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-forest mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-forest/50" size={18} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40 ${
                  errors.password ? 'border-forest/40' : 'border-sage'
                }`}
                placeholder="Your password"
              />
            </div>
            {errors.password && <p className="text-forest/80 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-sage text-forest/70"
            />
            <label htmlFor="rememberMe" className="text-sm text-forest">
              Remember me on this device
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-forest hover:bg-forest/90 disabled:bg-sage text-mist font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
          >
            {isLoading && <Loader className="animate-spin" size={18} />}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-sage"></div>
          <span className="px-3 text-forest/80 text-sm">Or</span>
          <div className="flex-1 border-t border-sage"></div>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-forest/80">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-forest/70 hover:text-forest/80 font-semibold"
              >
                Create one
              </button>
            </p>
          </div>
          <div className="text-center">
            <button
              type="button"
              className="text-forest/70 hover:text-forest/80 font-semibold text-sm"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Demo Credentials Note */}
        <div className="mt-6 p-3 bg-mist border border-sage rounded-lg">
          <p className="text-xs text-forest">
            <strong>Demo:</strong> Use any valid email for testing
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
