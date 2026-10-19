import { Appearance, Alert, Platform } from 'react-native';
import { getItem, setItem } from './storage';
import { clearBackgroundImage } from './backgroundImage';
import { applyAppearance, FONT_SCALES } from '../constants/theme';

const KEY = 'lingobridge_appearance';

// Existing users stay on the light theme until they pick something else.
export const DEFAULT_PREFS = { theme: 'light', textSize: 'default' };

export const loadAppearancePrefs = async () => {
  try {
    const raw = await getItem(KEY);
    const stored = raw ? JSON.parse(raw) : {};
    const { backgroundColor: _removedBackgroundColor, backgroundImage: _removedBackgroundImage, ...prefs } = stored;
    return { ...DEFAULT_PREFS, ...prefs };
  } catch (e) {
    return { ...DEFAULT_PREFS };
  }
};

export const saveAppearancePrefs = (prefs) => {
  const { backgroundColor: _removedBackgroundColor, backgroundImage: _removedBackgroundImage, ...cleanPrefs } = prefs;
  return setItem(KEY, JSON.stringify(cleanPrefs));
};

export const resolveScheme = (theme) => {
  if (theme === 'dark' || theme === 'light') return theme;
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
};

export const effectiveScheme = (prefs) => resolveScheme(prefs.theme);

// Must finish before any screen module is imported (see App.js).
export const initAppearance = async () => {
  const prefs = await loadAppearancePrefs();
  // Remove saved images from earlier versions now that background pictures are no longer supported.
  await clearBackgroundImage();
  const scheme = applyAppearance({
    scheme: resolveScheme(prefs.theme),
    fontScale: FONT_SCALES[prefs.textSize] || 1,
  });
  try {
    // Keeps native keyboards / system dialogs in step with the in-app theme.
    Appearance.setColorScheme(prefs.theme === 'system' ? null : scheme);
  } catch (e) {
    // Not available on every platform; safe to ignore.
  }
  return { prefs, scheme };
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
