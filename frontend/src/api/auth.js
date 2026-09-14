import { post, get } from './client';

export const login = async (email, password) => {
  const response = await post('/auth/login', { email, password });
  return response.data.data; // { token, user }
};

export const register = async (firstName, lastName, email, password) => {
  const response = await post('/auth/register', { firstName, lastName, email, password });
  return response.data.data; // { token, user }
};

export const getMe = async () => {
  const response = await get('/auth/me');
  return response.data.data; // { user, profile }
};

export const forgotPassword = async (email) => {
  const response = await post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await post('/auth/reset-password', { token, password });
  return response.data.data;
};

export const logout = async () => {
  return true;
};
