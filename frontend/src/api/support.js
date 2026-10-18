import { get, post } from './client';

export const createTicket = async ({ category, subject, message }) => {
  const response = await post('/support', { category, subject, message });
  return response.data.data;
};

export const getMyTickets = async () => {
  const response = await get('/support/mine');
  return response.data.data;
};

// The learner answers on their own request.
export const replyToTicket = async (id, message) => {
  const response = await post(`/support/${id}/replies`, { message });
  return response.data.data;
};

// { count, items } - support replies the learner has not read yet.
export const getNotifications = async () => {
  const response = await get('/support/notifications');
  return response.data.data;
};

export const markTicketSeen = async (id) => {
  const response = await post(`/support/${id}/seen`);
  return response.data.data;
};

export const markIdentityVerificationSeen = async () => {
  const response = await post('/support/identity-verification/seen');
  return response.data.data;
};
