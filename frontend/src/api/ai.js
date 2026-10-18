import { get, post } from './client';

export const sendChatMessage = async (message) => {
  const response = await post('/ai/chat', { message });
  return response.data.data;
};

export const getChatHistory = async () => {
  const response = await get('/ai/history');
  return response.data.data;
};

export const getSuggestions = async () => {
  const response = await get('/ai/suggestions');
  return response.data.data;
};
