// Whole calendar days in the device's local timezone.
const dayNumber = (date) => Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86400000);

// "Today", "Yesterday", "3 days ago", or a date for anything older than a week.
export const timeAgo = (value) => {
  if (!value) return '';
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return '';
  const days = dayNumber(new Date()) - dayNumber(then);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString();
};

// The stored streak only changes when a session is completed, so a streak whose last practice day
// is before yesterday has lapsed and should read 0.
export const currentStreak = (streak) => {
  if (!streak?.lastPracticeDate) return 0;
  const gap = dayNumber(new Date()) - dayNumber(new Date(streak.lastPracticeDate));
  return gap <= 1 ? streak.current || 0 : 0;
};

export const titleCase = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);
