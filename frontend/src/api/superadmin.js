import { get, post, put } from './client';

export const getDashboardStats = async () => {
  const response = await get('/super-admin/dashboard');
  return response.data.data;
};

export const getAdmins = async () => {
  const response = await get('/super-admin/admins');
  return response.data.data;
};

export const createAdmin = async (data) => {
  const response = await post('/super-admin/admins', data);
  return response.data.data;
};

export const toggleAdminStatus = async (id, isActive) => {
  const response = await put(`/super-admin/admins/${id}/status`, { isActive });
  return response.data.data;
};

export const getRoles = async () => {
  const response = await get('/super-admin/roles');
  return response.data.data;
};

export const getAnalytics = async () => {
  const response = await get('/super-admin/analytics');
  return response.data.data;
};

export const getSystemMonitoring = async () => {
  const response = await get('/super-admin/system');
  return response.data.data;
};

export const getAuditLogs = async (params) => {
  const response = await get('/super-admin/audit-logs', { params });
  return response.data;
};
