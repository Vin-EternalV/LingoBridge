// Palettes. `COLORS` is mutated in place by applyAppearance() BEFORE any screen module
// loads (see App.js), so every StyleSheet built afterwards picks up the chosen theme.
// Note: `white` means "surface" (cards, inputs). Use `onPrimary` for text/icons that sit on
// a coloured (primary/danger) background.
const LIGHT_COLORS = {
  primary: '#163832',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  primaryLighter: '#EFF6FF',
  white: '#FFFFFF',
  onPrimary: '#FFFFFF',
  background: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningText: '#92400E',
  warningTextStrong: '#78350F',
  border: '#E2E8F0',
  card: '#FFFFFF',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const DARK_COLORS = {
  primary: '#3B82F6',
  primaryDark: '#BFDBFE',
  primaryLight: '#1E3A8A',
  primaryLighter: '#172554',
  white: '#1E293B',
  onPrimary: '#FFFFFF',
  background: '#0F172A',
  text: '#F1F5F9',
  textSecondary: '#A8B5C7',
  textLight: '#7B8AA0',
  success: '#34D399',
  successLight: '#064E3B',
  error: '#F87171',
  errorLight: '#4C1D1D',
  warning: '#FBBF24',
  warningLight: '#4A3208',
  warningText: '#FCD34D',
  warningTextStrong: '#FDE68A',
  border: '#334155',
  card: '#1E293B',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const COLORS = { ...LIGHT_COLORS };

const buildFonts = (scale = 1) => ({
  regular: { fontSize: Math.round(16 * scale), color: COLORS.text },
  small: { fontSize: Math.round(14 * scale), color: COLORS.textSecondary },
  tiny: { fontSize: Math.round(12 * scale), color: COLORS.textLight },
  h1: { fontSize: Math.round(28 * scale), fontWeight: 'bold', color: COLORS.text },
  h2: { fontSize: Math.round(24 * scale), fontWeight: 'bold', color: COLORS.text },
  h3: { fontSize: Math.round(20 * scale), fontWeight: '600', color: COLORS.text },
  h4: { fontSize: Math.round(18 * scale), fontWeight: '600', color: COLORS.text },
});

export const FONTS = buildFonts(1);

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
  },
};

export const FONT_SCALES = { default: 1, large: 1.15, xlarge: 1.3 };

// scheme: 'light' | 'dark'; fontScale: number.
export const applyAppearance = ({ scheme = 'light', fontScale = 1 } = {}) => {
  const effective = scheme;
  Object.assign(COLORS, effective === 'dark' ? DARK_COLORS : LIGHT_COLORS);
  const fonts = buildFonts(fontScale);
  Object.keys(fonts).forEach((key) => {
    FONTS[key] = fonts[key];
  });
  return effective;
};
