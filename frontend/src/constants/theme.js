export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  primaryLighter: '#EFF6FF',
  white: '#FFFFFF',
  background: '#F8FAFC',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  border: '#E2E8F0',
  card: '#FFFFFF',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const FONTS = {
  regular: { fontSize: 16, color: COLORS.text },
  small: { fontSize: 14, color: COLORS.textSecondary },
  tiny: { fontSize: 12, color: COLORS.textLight },
  h1: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  h2: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  h3: { fontSize: 20, fontWeight: '600', color: COLORS.text },
  h4: { fontSize: 18, fontWeight: '600', color: COLORS.text },
};

export const SPACING = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };
export const SHADOWS = {
  light: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  }
};
