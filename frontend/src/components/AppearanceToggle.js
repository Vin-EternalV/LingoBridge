import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { effectiveScheme, loadAppearancePrefs, reloadApp, saveAppearancePrefs } from '../utils/appearance';

const AppearanceToggle = () => {
  const [prefs, setPrefs] = useState(null);
  const [busy, setBusy] = useState(false);
  const scheme = prefs ? effectiveScheme(prefs) : 'light';
  const nextScheme = scheme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    loadAppearancePrefs().then(setPrefs);
  }, []);

  const toggle = async () => {
    if (!prefs || busy) return;
    setBusy(true);
    const nextPrefs = { ...prefs, theme: nextScheme };
    await saveAppearancePrefs(nextPrefs);
    setPrefs(nextPrefs);
    reloadApp();
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={toggle}
      disabled={!prefs || busy}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${nextScheme} mode`}
    >
      {busy ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Ionicons name={nextScheme === 'dark' ? 'moon-outline' : 'sunny-outline'} size={18} color={COLORS.primary} />
      )}
      <Text style={styles.label}>{nextScheme === 'dark' ? 'Dark mode' : 'Light mode'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
});

export default AppearanceToggle;
