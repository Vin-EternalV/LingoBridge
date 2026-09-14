import { get, put } from './client';

export const getProfile = async () => {
  const response = await get('/users/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await put('/users/profile', data);
  return response.data;
};

export const updateOnboarding = async (data) => {
  const response = await put('/users/onboarding', {
    englishLevel: data.englishLevel || data.level,
    learningGoals: data.learningGoals || data.goals || [],
    preferredAreas: data.preferredAreas || data.areas || [],
    areasOfDifficulty: data.areasOfDifficulty || data.difficulties || [],
  });
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await put('/users/settings', data);
  return response.data;
};

export const updatePassword = async (currentPassword, newPassword) => {
  const response = await put('/users/password', { currentPassword, newPassword });
  return response.data;
};
