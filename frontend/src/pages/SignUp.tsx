import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Loader } from 'lucide-react';
import logo from '../assets/logo.png';
import signUpImage from '../assets/signup.png';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const signupResponse = await apiClient.signup(formData.email, formData.password, formData.fullName);
      let accessToken: unknown = signupResponse.data?.access_token;

      if (typeof accessToken !== 'string' || !accessToken.trim()) {
        const loginResponse = await apiClient.login(formData.email, formData.password);
        accessToken = loginResponse.data?.access_token;
      }

      if (typeof accessToken !== 'string' || !accessToken.trim()) {
        throw new Error('Account created, but sign-in could not be completed. Please sign in.');
      }

      apiClient.setAuthHeader(accessToken);
      const userResponse = await apiClient.getCurrentUser();
      setUser(userResponse.data);
      setToken(accessToken);
      toast.success('Account created successfully!');
      navigate('/profile');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to create account'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mist via-white to-lime/10 lg:grid lg:min-h-[100svh] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-sage/40 via-mist to-lime/10 sm:h-44 lg:h-[100svh]">
        <img
          src={signUpImage}
          alt="DAINE sign up"
          className="h-full w-full max-w-[15rem] object-contain p-3 sm:max-w-[18rem] lg:max-h-[75svh] lg:max-w-[28rem] lg:p-10"
        />
      </div>
      <div className="flex items-center justify-center p-3 sm:p-6 lg:min-h-[100svh] lg:px-10 lg:py-3">
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
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-forest">Create Account</h1>
          <p className="mt-1 text-sm text-forest/80">Join DAINE for personalized meal recommendations</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-forest mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-forest/50" size={18} />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime/60 ${
                  errors.fullName ? 'border-forest/40' : 'border-sage'
                }`}
                placeholder="Your full name"
              />
            </div>
            {errors.fullName && <p className="text-forest/80 text-sm mt-1">{errors.fullName}</p>}
          </div>

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
                placeholder="Min 8 characters"
              />
            </div>
            {errors.password && <p className="text-forest/80 text-sm mt-1">{errors.password}</p>}
            <ul className="mt-1 space-y-0.5 text-[11px] leading-tight text-forest/80">
              <li>✓ At least 8 characters</li>
              <li>✓ Mix of letters, numbers, symbols recommended</li>
            </ul>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-forest mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-forest/50" size={18} />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime/60 ${
                  errors.confirmPassword ? 'border-forest/40' : 'border-sage'
                }`}
                placeholder="Re-enter password"
              />
            </div>
            {errors.confirmPassword && <p className="text-forest/80 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-b-4 border-[#487935] bg-lime py-2.5 font-bold text-forest shadow-md transition-all hover:-translate-y-0.5 hover:bg-lime/90 disabled:border-sage disabled:bg-sage"
          >
            {isLoading && <Loader className="animate-spin" size={18} />}
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-3 flex items-center">
          <div className="flex-1 border-t border-sage"></div>
          <span className="px-3 text-forest/80 text-sm">Or</span>
          <div className="flex-1 border-t border-sage"></div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-forest/80">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/signin')}
              className="text-forest/70 hover:text-forest/80 font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>

        {/* Privacy Note */}
        <p className="mt-3 text-center text-[11px] leading-tight text-forest/70">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
