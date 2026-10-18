import { get } from './client';

export const getProgress = async () => {
  const response = await get('/progress');
  return response.data.data;
};

export const getHistory = async (params) => {
  const response = await get('/progress/history', { params });
  return response.data;
};

export const getSessionDetail = async (sessionId) => {
  const response = await get(`/progress/history/${sessionId}`);
  return response.data.data;
};
