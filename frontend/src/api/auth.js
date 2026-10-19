import { post, get } from './client';

export const login = async (email, password) => {
  const response = await post('/auth/login', { email, password });
  return response.data.data; // { token, user }  OR  { otpRequired, challenge, email, purpose, resendIn }
};

export const register = async (firstName, lastName, email, password, extra = {}) => {
  const response = await post('/auth/register', { firstName, lastName, email, password, ...extra });
  return response.data.data; // { otpRequired, challenge, ... }  (or { token, user } when OTP is off)
};

// Second step of sign-up / login: the 6-digit code from the email.
export const verifyOtp = async (challenge, code) => {
  const response = await post('/auth/verify-otp', { challenge, code });
  return response.data.data; // { token, user }
};

export const resendOtp = async (challenge) => {
  const response = await post('/auth/resend-otp', { challenge });
  return response.data.data; // { resendIn }
};

export const completeAdminSetup = async (email, code, password) => {
  const response = await post('/auth/admin-setup', { email, code, password });
  return response.data.data;
};

export const resendAdminSetupCode = async (email) => {
  const response = await post('/auth/admin-setup/resend', { email });
  return response.data.data;
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
