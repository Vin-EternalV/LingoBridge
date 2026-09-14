import { get, post, put } from './client';

export const generateExercises = async ({ skill, topic, difficulty }) => {
  const response = await post('/practice/generate', { skill, topic, difficulty });
  return response.data.data;
};

export const submitAnswer = async ({ exercise, userAnswer }) => {
  const response = await post('/practice/submit', { exercise, userAnswer });
  return response.data.data;
};

export const createSession = async ({ skill, topic, difficulty }) => {
  const response = await post('/practice/sessions', { skill, topic, difficulty });
  return response.data.data;
};

export const updateSession = async (sessionId, sessionData) => {
  const response = await put(`/practice/sessions/${sessionId}`, sessionData);
  return response.data.data;
};

export const getSessions = async () => {
  const response = await get('/practice/sessions');
  return response.data.data;
};

export const getSessionById = async (sessionId) => {
  const response = await get(`/practice/sessions/${sessionId}`);
  return response.data.data;
};
