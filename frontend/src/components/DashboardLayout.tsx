import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Heart,
  Home,
  Languages,
  LogOut,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store';
import { useFoodLanguageStore } from '../store';

const navigation = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Dashboard', to: '/generate-meal-prep', icon: Sparkles },
  { label: 'Daily Calendar', to: '/calendar/daily', icon: CalendarDays },
  { label: 'Inventory', to: '/inventory', icon: ClipboardList },
  { label: 'Favorite Meals', to: '/favorites', icon: Heart },
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Substitutions', to: '/substitutions', icon: Sparkles },
  { label: 'What-If Analysis', to: '/what-if', icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { foodLanguage, setFoodLanguage } = useFoodLanguageStore();

  const handleSignOut = () => {
    apiClient.clearAuth();
    clearAuth();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-mist lg:flex">
      <aside className="bg-sage text-forest lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="border-b border-forest/40 px-5 py-5">
          <p className="text-xl font-bold tracking-tight">DAINE</p>
          <p className="mt-1 text-xs text-forest/80">Dietary decision support</p>
        </div>

        <nav aria-label="Main navigation" className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-forest text-mist'
                    : 'text-forest hover:bg-mist hover:text-forest/80'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-forest/40 p-4">
          <label htmlFor="food-language" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-forest/80">
            <Languages size={16} />
            Food name language
          </label>
          <select
            id="food-language"
            value={foodLanguage}
            onChange={(event) => setFoodLanguage(event.target.value as 'en' | 'si' | 'ta')}
            className="w-full rounded-lg border border-forest/40 bg-mist px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-forest/40"
          >
            <option value="en">English</option>
            <option value="si">සිංහල</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>

        <div className="border-t border-forest/40 p-4">
          <p className="truncate text-sm font-medium">{user?.full_name || user?.email || 'Your account'}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 flex items-center gap-2 text-sm text-forest/80 hover:text-forest/80"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
};

export default DashboardLayout;
