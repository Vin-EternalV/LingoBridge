// Shared by web and native: the bell in the top bar.

// Screens call emitNotificationsChanged() after they change something (read a reply, answer a request)
// so the bell refreshes straight away instead of waiting for its next check.
const listeners = new Set();

export const onNotificationsChanged = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitNotificationsChanged = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      // A broken listener must not stop the others.
    }
  });
};

// "just now", "5 min ago", "3 h ago", "2 d ago", then the date.
export const timeAgo = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return date.toLocaleDateString();
};