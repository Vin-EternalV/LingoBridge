import { COLORS } from '../constants/theme';

export const MIN_SCORABLE_WORDS = 30;

export const countWords = (text) => (String(text || '').trim().match(/\S+/g) || []).length;

// 6 -> "6.0", 6.5 -> "6.5", like IELTS reports.
export const formatBand = (band) => (typeof band === 'number' ? band.toFixed(1) : '-');

export const bandColor = (band) => {
  if (band >= 7) return COLORS.success;
  if (band >= 5.5) return COLORS.primary;
  if (band >= 4.5) return COLORS.warning;
  return COLORS.error;
};

export const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
