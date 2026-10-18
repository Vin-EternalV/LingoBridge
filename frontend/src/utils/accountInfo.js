// Helpers for the Account Settings screen: date formatting and account type names.

const format = (value, options) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, options);
};

export const formatDate = (value) => format(value, { year: 'numeric', month: 'long', day: 'numeric' });

export const formatDateTime = (value) =>
  format(value, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export const roleLabel = (role) => (role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Learner');
