import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import toast from 'react-hot-toast';
import { Home, Mail, Lock, Loader } from 'lucide-react';
import logo from '../assets/logo.png';
import signInImage from '../assets/signin.png';

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
    <div className="min-h-screen bg-gradient-to-br from-mist via-white to-lime/10 lg:grid lg:min-h-[100svh] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-sage/40 via-mist to-lime/10 sm:h-44 lg:h-[100svh]">
        <img
          src={signInImage}
          alt="DAINE sign in"
          className="h-full w-full max-w-[15rem] object-contain p-3 sm:max-w-[18rem] lg:max-h-[75svh] lg:max-w-[28rem] lg:p-10"
        />
      </div>
      <div className="flex items-center justify-center p-3 sm:p-6 lg:min-h-[100svh] lg:px-10 lg:py-4">
        <div className="w-full max-w-md rounded-2xl border border-sage/70 bg-white/90 p-5 shadow-xl shadow-forest/10 sm:p-7">
        <div className="mb-2 flex justify-center">
          <div className="h-8 w-28 overflow-hidden">
            <img
              src={logo}
              alt="DAINE"
              className="h-full w-full object-cover"
              style={{ objectPosition: 'center 49%' }}
            />
          </div>
        </div>
        {/* Header */}
        <div className="mb-3 flex justify-start">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Go to home page"
            className="inline-flex items-center gap-2 rounded-lg border border-sage px-3 py-1.5 text-sm font-semibold text-forest transition-colors hover:bg-lime/20"
          >
            <Home size={18} />
            Home
          </button>
        </div>
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-forest">Welcome Back</h1>
          <p className="mt-1 text-sm text-forest/80">Sign in to your DAINE account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-forest mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-forest/50" size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime/60 ${
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
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime/60 ${
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
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-b-4 border-[#487935] bg-lime py-2.5 font-bold text-forest shadow-md transition-all hover:-translate-y-0.5 hover:bg-lime/90 disabled:border-sage disabled:bg-sage"
          >
            {isLoading && <Loader className="animate-spin" size={18} />}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-sage"></div>
          <span className="px-3 text-forest/80 text-sm">Or</span>
          <div className="flex-1 border-t border-sage"></div>
        </div>

        {/* Links */}
        <div className="space-y-2 text-sm">
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
        <div className="mt-4 rounded-lg border border-sage bg-mist p-2.5">
          <p className="text-xs text-forest">
            <strong>Demo:</strong> Use any valid email for testing
          </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
