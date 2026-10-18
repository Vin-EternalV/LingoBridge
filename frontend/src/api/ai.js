import { get, post } from './client';

export const sendChatMessage = async (message, chatHistory = [], learnerLevel) => {
  const response = await post('/ai/chat', { message, chatHistory, learnerLevel });
  return response.data.data;
};

export const getSuggestions = async () => {
  const response = await get('/ai/suggestions');
  return response.data.data;
};
