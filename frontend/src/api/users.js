import { get, put, post, del } from './client';

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

export const updateLearningProfile = async (data) => {
  const response = await put('/users/learning-profile', data);
  return response.data.data;
};

export const updateGoals = async (data) => {
  const response = await put('/users/goals', data);
  return response.data.data;
};

export const getGoalsProgress = async () => {
  const response = await get('/users/goals-progress', {
    params: { tzOffset: new Date().getTimezoneOffset() },
  });
  return response.data.data;
};

export const deleteAccount = async (password) => {
  const response = await del('/users/me', { data: { password } });
  return response.data;
};

export const updatePrivacy = async (privacy) => {
  const response = await put('/users/settings', { privacy });
  return response.data.data;
};

export const logoutAllDevices = async () => {
  const response = await post('/users/logout-all');
  return response.data.data; // { token }
};

export const exportMyData = async () => {
  const response = await get('/users/export');
  return response.data.data;
};

export const clearAiHistory = async () => {
  const response = await del('/users/me/ai-history');
  return response.data.data;
};

export const clearPracticeHistory = async () => {
  const response = await del('/users/me/practice-history');
  return response.data.data;
};
