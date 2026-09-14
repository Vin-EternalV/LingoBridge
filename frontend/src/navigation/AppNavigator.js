import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import LearnerStack from './LearnerStack';
import AdminNavigation from './AdminNavigation';
import SuperAdminNavigation from './SuperAdminNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading LingoBridge..." />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (user?.role === 'admin') {
    return <AdminNavigation />;
  }

  if (user?.role === 'superadmin') {
    return <SuperAdminNavigation />;
  }

  // Learner onboarding check
  const isOnboardingDone = user?.onboardingCompleted || user?.onboardingComplete || user?.profile?.onboardingComplete;
  if (user && !isOnboardingDone) {
    return <OnboardingStack />;
  }

  return <LearnerStack />;
};

export default AppNavigator;
