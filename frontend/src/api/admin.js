import { get, post, put, del } from './client';

export const getDashboardStats = async () => {
  const response = await get('/admin/dashboard');
  return response.data;
};

export const getUsers = async (params) => {
  const response = await get('/admin/users', { params });
  return response.data;
};

export const toggleUserStatus = async (userId, isActive) => {
  const response = await put(`/admin/users/${userId}/status`, { isActive });
  return response.data;
};

export const getContent = async () => {
  const response = await get('/admin/content');
  return response.data;
};

export const createContent = async (data) => {
  const response = await post('/admin/content', data);
  return response.data;
};

export const updateContent = async (id, data) => {
  const response = await put(`/admin/content/${id}`, data);
  return response.data;
};

export const deleteContent = async (id) => {
  const response = await del(`/admin/content/${id}`);
  return response.data;
};

export const getAIActivity = async () => {
  const response = await get('/admin/ai-activity');
  return response.data;
};

export const getReports = async () => {
  const response = await get('/admin/reports');
  return response.data;
};
