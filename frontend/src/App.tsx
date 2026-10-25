import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { apiClient } from './api/client';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';
import axios from 'axios';
import { getApiErrorMessage } from './utils/errorMessage';



// Import all pages
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Profile from './pages/Profile';
import Inventory from './pages/Inventory';
import GenerateMealPrep from './pages/GenerateMealPrep';
import MealDetails from './pages/MealDetails';
import WhatIfAnalysis from './pages/WhatIfAnalysis';
import IngredientSubstitution from './pages/IngredientSubstitution';
import FavoriteMeals from './pages/FavoriteMeals';
import DailyCalendar from './pages/DailyCalendar';
import DashboardLayout from './components/DashboardLayout';

// Placeholder for WeeklyCalendar - reuse DailyCalendar for now
const WeeklyCalendar = DailyCalendar;
// Protected Route Component
const ProtectedRoute = ({
  children,
  isRestoringSession,
}: {
  children: React.ReactNode;
  isRestoringSession: boolean;
}) => {
  const { isAuthenticated } = useAuthStore();
  if (isRestoringSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist">
        <Loader className="animate-spin text-forest/70" size={32} />
      </div>
    );
  }
  return isAuthenticated
    ? <DashboardLayout>{children}</DashboardLayout>
    : <Navigate to="/signin" />;
};

function App() {
  const { setUser, setProfile, clearAuth, token } = useAuthStore();
  const [isRestoringSession, setIsRestoringSession] = React.useState(Boolean(token));

  React.useEffect(() => {
    let isCurrent = true;

    const restoreSession = async () => {
      if (!token) {
        setIsRestoringSession(false);
        return;
      }

      try {
        const userResponse = await apiClient.getCurrentUser();
        if (!isCurrent) return;
        setUser(userResponse.data);

        try {
          const profileResponse = await apiClient.getProfile();
          if (isCurrent) setProfile(profileResponse.data);
        } catch (error: unknown) {
          if (!isCurrent) return;
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            setProfile(null);
          } else {
            toast.error(getApiErrorMessage(error, 'Failed to restore your dietary profile'));
          }
        }
      } catch (error: unknown) {
        if (!isCurrent) return;
        if (
          axios.isAxiosError(error) &&
          (error.response?.status === 401 || error.response?.status === 403)
        ) {
          clearAuth();
        } else {
          toast.error(getApiErrorMessage(error, 'Unable to verify your session. Please try again.'));
        }
      } finally {
        if (isCurrent) setIsRestoringSession(false);
      }
    };

    void restoreSession();
    return () => {
      isCurrent = false;
    };
  }, [token, setUser, setProfile, clearAuth]);

  const protectedPage = (children: React.ReactNode) => (
    <ProtectedRoute isRestoringSession={isRestoringSession}>
      {children}
    </ProtectedRoute>
  );

  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Protected Routes */}
          <Route path="/profile" element={protectedPage(<Profile />)} />
          <Route path="/inventory" element={protectedPage(<Inventory />)} />
          <Route path="/generate-meal-prep" element={protectedPage(<GenerateMealPrep />)} />
          <Route path="/meal/:mealId" element={protectedPage(<MealDetails />)} />
          <Route path="/what-if" element={protectedPage(<WhatIfAnalysis />)} />
          <Route path="/substitutions" element={protectedPage(<IngredientSubstitution />)} />
          <Route path="/favorites" element={protectedPage(<FavoriteMeals />)} />
          <Route path="/calendar/daily" element={protectedPage(<DailyCalendar />)} />
          <Route path="/calendar/weekly" element={protectedPage(<WeeklyCalendar />)} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
