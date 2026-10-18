import { Appearance, Alert, Platform } from 'react-native';
import { getItem, setItem } from './storage';
import { loadBackgroundImageUri } from './backgroundImage';
import { applyAppearance, deriveBackgroundPalette, FONT_SCALES } from '../constants/theme';

const KEY = 'lingobridge_appearance';

// Existing users stay on the light theme until they pick something else.
// backgroundImage: null or { text: 'light' | 'dark' } (the picture itself is stored by utils/backgroundImage.js)
export const DEFAULT_PREFS = { theme: 'light', textSize: 'default', backgroundColor: null, backgroundImage: null };

export const loadAppearancePrefs = async () => {
  try {
    const raw = await getItem(KEY);
    return { ...DEFAULT_PREFS, ...(raw ? JSON.parse(raw) : {}) };
  } catch (e) {
    return { ...DEFAULT_PREFS };
  }
};

export const saveAppearancePrefs = (prefs) => setItem(KEY, JSON.stringify(prefs));

export const resolveScheme = (theme) => {
  if (theme === 'dark' || theme === 'light') return theme;
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
};

// The scheme the app really shows: a custom background colour decides light/dark text on its own.
export const effectiveScheme = (prefs) => {
  if (prefs.backgroundImage) return prefs.backgroundImage.text === 'light' ? 'dark' : 'light';
  return deriveBackgroundPalette(prefs.backgroundColor)?.scheme || resolveScheme(prefs.theme);
};

// Must finish before any screen module is imported (see App.js).
export const initAppearance = async () => {
  const prefs = await loadAppearancePrefs();
  // Only use the picture if it is still stored on this device.
  const backgroundImageUri = prefs.backgroundImage ? await loadBackgroundImageUri() : null;
  const backgroundImage = backgroundImageUri ? prefs.backgroundImage : null;
  const scheme = applyAppearance({
    scheme: resolveScheme(prefs.theme),
    fontScale: FONT_SCALES[prefs.textSize] || 1,
    backgroundColor: prefs.backgroundColor,
    backgroundImage,
  });
  try {
    // Keeps native keyboards / system dialogs in step with the in-app theme.
    Appearance.setColorScheme(prefs.theme === 'system' && !prefs.backgroundColor && !backgroundImage ? null : scheme);
  } catch (e) {
    // Not available on every platform; safe to ignore.
  }
  return { prefs, scheme, backgroundImageUri, backgroundImage };
};

// Styles are created once when screens load, so a theme change needs a fresh start.
export const reloadApp = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.reload();
    return;
  }
  // DevSettings only exists on native (and only reloads in development / Expo Go).
  const { DevSettings } = require('react-native');
  if (__DEV__ && DevSettings && typeof DevSettings.reload === 'function') {
    DevSettings.reload();
    return;
  }
  Alert.alert('Restart needed', 'Close and reopen LingoBridge to finish applying your appearance settings.');
};
