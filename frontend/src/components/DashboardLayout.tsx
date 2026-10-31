import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  ChevronDown,
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
import black from '../assets/black.png';

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
  const mainRef = useRef<HTMLElement>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  useEffect(() => {
    const updateScrollHint = () => {
      const scroller = document.scrollingElement;
      if (!scroller) return;
      setHasMoreBelow(
        scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 48,
      );
    };

    updateScrollHint();
    window.addEventListener('scroll', updateScrollHint, { passive: true });
    window.addEventListener('resize', updateScrollHint);

    const observer = new ResizeObserver(updateScrollHint);
    if (mainRef.current) observer.observe(mainRef.current);
    observer.observe(document.documentElement);

    return () => {
      window.removeEventListener('scroll', updateScrollHint);
      window.removeEventListener('resize', updateScrollHint);
      observer.disconnect();
    };
  }, []);

  const handleSignOut = () => {
    apiClient.clearAuth();
    clearAuth();
    navigate('/signin');
  };

  return (
    <div className="dashboard-shell min-h-screen bg-mist lg:flex">
      <aside className="relative z-20 bg-sage text-forest lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="border-b border-forest/40 px-5 py-5">
          <div className="h-10 w-32 overflow-hidden">
            <img
              src={black}
              alt="DAINE"
              className="h-full w-full object-cover"
              style={{ objectPosition: 'center 49%' }}
            />
          </div>
          <p className="mt-1 text-xs text-forest/80">Dietary decision support</p>
        </div>

        <nav aria-label="Main navigation" className="relative z-10 flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              end={to === '/'}
              to={to}
              className={({ isActive }) =>
                `relative z-10 flex shrink-0 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
                  isActive
                    ? 'bg-lime text-forest'
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

      <main ref={mainRef} className="dashboard-content min-w-0 flex-1">
        <header className="flex justify-end border-b border-sage/70 bg-mist px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/generate-meal-prep')}
            className="inline-flex items-center gap-2 rounded-full border-b-4 border-[#487935] bg-lime px-5 py-2 text-sm font-bold text-forest shadow-sm transition-all hover:-translate-y-0.5 hover:bg-lime/90"
          >
            <Sparkles size={16} />
            Get Started
          </button>
        </header>
        {children}
      </main>
      {hasMoreBelow && (
        <button
          type="button"
          aria-label="Scroll down to see more"
          title="Scroll down"
          onClick={() => window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' })}
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-forest/20 bg-white/90 p-2 text-forest shadow-lg backdrop-blur transition-colors hover:bg-lime lg:left-[calc(50%+8rem)]"
        >
          <ChevronDown className="animate-bounce" size={22} />
        </button>
      )}
    </div>
  );
};

export default DashboardLayout;
