import { get, post } from './client';

export const submitSurvey = async (payload) => {
  const response = await post('/survey', payload);
  return response.data.data;
};

// Rejects with a 404 when the learner has not taken the survey yet (the Dashboard handles that).
export const getMySurvey = async () => {
  const response = await get('/survey/me');
  return response.data.data;
};
