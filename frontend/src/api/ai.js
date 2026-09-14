import { get, post } from './client';

export const sendChatMessage = async (message, chatHistory) => {
  const response = await post('/ai/chat', { message, history: chatHistory });
  return response.data.data;
};

export const getSuggestions = async () => {
  const response = await get('/ai/suggestions');
  return response.data.data;
};
