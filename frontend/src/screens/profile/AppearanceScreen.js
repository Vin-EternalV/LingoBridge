import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadAppearancePrefs, saveAppearancePrefs, reloadApp } from '../../utils/appearance';
import { confirmAction } from '../../utils/dialog';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import BackgroundColorPicker from '../../components/BackgroundColorPicker';
import BackgroundImagePicker from '../../components/BackgroundImagePicker';
import { applyBackgroundImage, loadBackgroundImageState, sameImage } from '../../utils/backgroundImage';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { COLORS, FONTS, FONT_SCALES, RADIUS, SPACING } from '../../constants/theme';

const THEMES = [
  { id: 'light', title: 'Light', icon: 'sunny-outline' },
  { id: 'dark', title: 'Dark', icon: 'moon-outline' },
  { id: 'system', title: 'System', icon: 'phone-portrait-outline' },
];

const TEXT_SIZES = [
  { id: 'default', title: 'Default' },
  { id: 'large', title: 'Large' },
  { id: 'xlarge', title: 'Extra large' },
];

const Option = ({ selected, onPress, children }) => (
  <TouchableOpacity
    style={[styles.option, selected && styles.optionSelected]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
  >
    {children}
  </TouchableOpacity>
);

const AppearanceScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(null);
  const [theme, setTheme] = useState('light');
  const [textSize, setTextSize] = useState('default');
  const [backgroundColor, setBackgroundColor] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [savedImage, setSavedImage] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadAppearancePrefs().then(async (prefs) => {
      const image = await loadBackgroundImageState(prefs);
      setSavedImage(image);
      setBackgroundImage(image);
      setSaved(prefs);
      setTheme(prefs.theme);
      setTextSize(prefs.textSize);
      setBackgroundColor(prefs.backgroundColor || null);
      setLoading(false);
    });
  }, []);

  const dirty =
    !!saved &&
    (theme !== saved.theme ||
      textSize !== saved.textSize ||
      (backgroundColor || null) !== (saved.backgroundColor || null) ||
      !sameImage(backgroundImage, savedImage));
  const scale = FONT_SCALES[textSize] || 1;

  const handleApply = async () => {
    let imagePrefs;
    try {
      imagePrefs = await applyBackgroundImage(backgroundImage);
    } catch (e) {
      setStatus({ type: 'error', message: e.message });
      return;
    }
    const prefs = { theme, textSize, backgroundColor, backgroundImage: imagePrefs };
    await saveAppearancePrefs(prefs);
    setSaved(prefs);
    setSavedImage(backgroundImage);
    setStatus(null);

    const restart = await confirmAction(
      'Restart to apply',
      'LingoBridge needs to restart to apply your appearance settings. Restart now?',
      { confirmText: 'Restart now' }
    );
    if (restart) {
      reloadApp();
    } else {
      setStatus({ type: 'success', message: 'Saved. Your changes will apply the next time LingoBridge starts.' });
    }
  };

  if (loading) {
    return (
      <Screen title="Appearance">
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen title="Appearance">
      <StatusMessage type={status?.type} message={status?.message} />

      <SectionLabel hint="System follows your device's light or dark setting each time the app starts.">
        Theme
      </SectionLabel>
      <View style={styles.optionRow}>
        {THEMES.map((item) => (
          <Option key={item.id} selected={theme === item.id} onPress={() => setTheme(item.id)}>
            <Ionicons
              name={item.icon}
              size={26}
              color={theme === item.id ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.optionText, theme === item.id && styles.optionTextSelected]}>{item.title}</Text>
          </Option>
        ))}
      </View>

      <SectionLabel hint="Pick any color for the app background. It replaces the Light/Dark background; choose the first circle to go back to the theme default.">
        Background color
      </SectionLabel>
      <BackgroundColorPicker value={backgroundColor} onChange={setBackgroundColor} />

      <SectionLabel hint="Use a picture from your gallery or computer. It replaces the background color.">
        Background picture
      </SectionLabel>
      <BackgroundImagePicker image={backgroundImage} onChange={setBackgroundImage} />

      <SectionLabel hint="Makes text larger across the app.">Text size</SectionLabel>
      <View style={styles.optionRow}>
        {TEXT_SIZES.map((item) => (
          <Option key={item.id} selected={textSize === item.id} onPress={() => setTextSize(item.id)}>
            <Text style={[styles.optionText, textSize === item.id && styles.optionTextSelected]}>{item.title}</Text>
          </Option>
        ))}
      </View>

      <SectionLabel>Preview text size</SectionLabel>
      <Card>
        <Text style={[styles.previewTitle, { fontSize: Math.round(20 * scale) }]}>Choose the best answer</Text>
        <Text style={[styles.previewBody, { fontSize: Math.round(16 * scale) }]}>
          She ___ to the market every Saturday morning.
        </Text>
      </Card>

      <Button title="Apply" onPress={handleApply} disabled={!dirty} fullWidth style={styles.applyButton} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: SPACING.xxxl },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    minHeight: 64,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLighter },
  optionText: { ...FONTS.small, fontWeight: '600', marginTop: SPACING.xs, textAlign: 'center' },
  optionTextSelected: { color: COLORS.primary },
  previewTitle: { fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  previewBody: { color: COLORS.textSecondary },
  applyButton: { marginTop: SPACING.base },
});

export default AppearanceScreen;
