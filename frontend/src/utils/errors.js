// Pulls the most useful message out of an axios error from the LingoBridge API.
export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  const data = err?.response?.data;
  if (data?.errors?.length && data.errors[0]?.msg) return data.errors[0].msg;
  if (data?.message) return data.message;
  if (err?.message === 'Network Error') return 'Cannot reach the server. Check your connection.';
  return fallback;
};
