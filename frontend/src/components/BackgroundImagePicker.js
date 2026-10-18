import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Button from './Button';
import { scrimFor } from './BackgroundLayer';
import { pickBackgroundImage } from '../utils/backgroundImage';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const TEXT_CHOICES = [
  { id: 'dark', title: 'Dark text' },
  { id: 'light', title: 'Light text' },
];

// image: { uri, text } | null; onChange(image | null)
const BackgroundImagePicker = ({ image, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const source = Platform.OS === 'web' ? 'computer' : 'gallery';

  const choose = async () => {
    setBusy(true);
    setError('');
    try {
      const uri = await pickBackgroundImage();
      if (uri) onChange({ uri, text: image?.text || 'dark' });
    } catch (e) {
      setError(e?.message || `Could not open your ${source}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      {image ? (
        <>
          <View style={styles.preview}>
            <Image source={{ uri: image.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: scrimFor(image.text) }]} />
            <Text style={[styles.previewText, { color: image.text === 'light' ? '#F1F5F9' : '#1E293B' }]}>
              Your picture
            </Text>
          </View>

          <Text style={styles.label}>Text color on the picture</Text>
          <View style={styles.row}>
            {TEXT_CHOICES.map((choice) => {
              const selected = image.text === choice.id;
              return (
                <TouchableOpacity
                  key={choice.id}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => onChange({ ...image, text: choice.id })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{choice.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Button title="Change picture" variant="outline" onPress={choose} loading={busy} />
            <Button title="Remove picture" variant="text" onPress={() => onChange(null)} />
          </View>
        </>
      ) : (
        <Button
          title={`Choose from ${source}`}
          variant="outline"
          onPress={choose}
          loading={busy}
          fullWidth
        />
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  preview: {
    height: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
    backgroundColor: COLORS.border,
  },
  previewText: { fontWeight: '700', fontSize: 16 },
  label: { ...FONTS.small, marginBottom: SPACING.xs },
  row: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLighter },
  optionText: { ...FONTS.small, fontWeight: '600' },
  optionTextSelected: { color: COLORS.primary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  error: { ...FONTS.tiny, color: COLORS.error, marginTop: SPACING.sm },
});

export default BackgroundImagePicker;
