import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Loader } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-mist to-sage flex items-center justify-center p-4">
      <div className="bg-sage rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-forest">Create Account</h1>
          <p className="text-forest/80 mt-2">Join DAINE for personalized meal recommendations</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-forest mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-forest/50" size={18} />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40 ${
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
                placeholder="Min 8 characters"
              />
            </div>
            {errors.password && <p className="text-forest/80 text-sm mt-1">{errors.password}</p>}
            <ul className="text-xs text-forest/80 mt-2 space-y-1">
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
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40 ${
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
            className="w-full bg-forest hover:bg-forest/90 disabled:bg-sage text-mist font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
          >
            {isLoading && <Loader className="animate-spin" size={18} />}
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
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
        <p className="text-xs text-forest/70 text-center mt-4">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SignUp;
