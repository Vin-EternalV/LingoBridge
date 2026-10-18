import { get, post, put, del } from './client';
import { API_URL } from '../constants/config';

// Marking an essay with AI can take up to a minute, so these calls wait longer than normal.
const SLOW = { timeout: 120000 };

export const getWritingPrompt = async ({ task, module, topic }) =>
  (await post('/ielts/writing/prompt', { task, module, topic }, SLOW)).data.data;

export const submitWriting = async (payload) =>
  (await post('/ielts/writing/submit', payload, SLOW)).data.data;

export const getWritingSubmissions = async () => (await get('/ielts/writing/submissions')).data.data;

export const getWritingStats = async () => (await get('/ielts/writing/stats')).data.data;

export const getWritingSubmission = async (id) =>
  (await get(`/ielts/writing/submissions/${id}`)).data.data;

export const deleteWritingSubmission = async (id) =>
  (await del(`/ielts/writing/submissions/${id}`)).data;

// ---------- Speaking ----------
export const getSpeakingSet = async ({ part, topic }) =>
  (await post('/ielts/speaking/set', { part, topic }, SLOW)).data.data;

export const submitSpeaking = async (payload) =>
  (await post('/ielts/speaking/submit', payload, SLOW)).data.data;

export const getSpeakingSubmissions = async () => (await get('/ielts/speaking/submissions')).data.data;

export const getSpeakingStats = async () => (await get('/ielts/speaking/stats')).data.data;

export const getSpeakingSubmission = async (id) =>
  (await get(`/ielts/speaking/submissions/${id}`)).data.data;

export const deleteSpeakingSubmission = async (id) =>
  (await del(`/ielts/speaking/submissions/${id}`)).data;

// ---------- Reading ----------
export const startReading = async ({ topic, mockId } = {}) =>
  (await post('/ielts/reading/start', { topic, mockId }, SLOW)).data.data;

export const getReadingTest = async (id) => (await get(`/ielts/reading/tests/${id}`)).data.data; // { status, test | result }

export const submitReading = async (id, { answers, timeSpentSec }) =>
  (await post(`/ielts/reading/tests/${id}/submit`, { answers, timeSpentSec })).data.data;

export const getReadingTests = async () => (await get('/ielts/reading/tests')).data.data;

export const getReadingStats = async () => (await get('/ielts/reading/stats')).data.data;

export const deleteReadingTest = async (id) => (await del(`/ielts/reading/tests/${id}`)).data;

// ---------- Mock tests and progress ----------
export const startMock = async (type) => (await post('/ielts/mock/start', { type })).data.data;

export const getMock = async (id) => (await get(`/ielts/mock/${id}`)).data.data;

export const deleteMock = async (id) => (await del(`/ielts/mock/${id}`)).data;

export const getProgress = async () => (await get('/ielts/progress')).data.data;

export const setTargetBand = async (targetBand) => (await put('/ielts/target', { targetBand })).data.data;

export const startListening = async ({ kind, topic, mockId } = {}) =>
  (await post('/ielts/listening/start', { kind, topic, mockId }, SLOW)).data.data;
export const getListeningTest = async (id) => (await get(`/ielts/listening/tests/${id}`)).data.data;
export const submitListening = async (id, { answers, timeSpentSec }) =>
  (await post(`/ielts/listening/tests/${id}/submit`, { answers, timeSpentSec })).data.data;
export const getListeningTests = async () => (await get('/ielts/listening/tests')).data.data;
export const getListeningStats = async () => (await get('/ielts/listening/stats')).data.data;
export const deleteListeningTest = async (id) => (await del(`/ielts/listening/tests/${id}`)).data;
export const getListeningAudioInfo = async (id) => (await get(`/ielts/listening/tests/${id}/audio-info`)).data.data;
export const resolveAudioUrl = (path) => `${API_URL}${path}`;
