import { get, post, put, del } from './client';

export const getDashboardStats = async () => {
  const response = await get('/admin/dashboard');
  return response.data.data;
};

export const getUsers = async (params) => {
  const response = await get('/admin/users', { params });
  return response.data;
};

export const toggleUserStatus = async (userId, isActive) => {
  const response = await put(`/admin/users/${userId}/status`, { isActive });
  return response.data.data;
};

export const suspendLearner = async (userId, days, reason) => {
  const response = await put(`/admin/users/${userId}/suspension`, { days, reason });
  return response.data.data;
};

export const getModerationReports = async () => {
  const response = await get('/admin/moderation-reports');
  return response.data.data;
};

export const getContent = async () => {
  const response = await get('/admin/content');
  return response.data.data;
};

export const createContent = async (data) => {
  const response = await post('/admin/content', data);
  return response.data.data;
};

export const updateContent = async (id, data) => {
  const response = await put(`/admin/content/${id}`, data);
  return response.data.data;
};

export const deleteContent = async (id) => {
  const response = await del(`/admin/content/${id}`);
  return response.data.data;
};

export const getAIActivity = async () => {
  const response = await get('/admin/ai-activity');
  return response.data.data;
};

export const getReports = async () => {
  const response = await get('/admin/reports');
  return response.data.data;
};

// Support requests sent by learners (Help & Support)
export const getSupportTickets = async (params) => {
  const response = await get('/admin/support', { params });
  return response.data.data;
};

// data: { status?: 'open' | 'in_progress' | 'resolved', reply?: string }
export const updateSupportTicket = async (id, data) => {
  const response = await put(`/admin/support/${id}`, data);
  return response.data.data;
};

// { count, items } - support requests waiting for an answer.
export const getSupportNotifications = async () => {
  const response = await get('/admin/support/notifications');
  return response.data.data;
};

export const markModerationNotificationSeen = async (id) => {
  const response = await post(`/admin/moderation-reports/${id}/seen`);
  return response.data.data;
};

export const markSupportNotificationSeen = async (id) => {
  const response = await post(`/admin/support/${id}/seen`);
  return response.data.data;
};
