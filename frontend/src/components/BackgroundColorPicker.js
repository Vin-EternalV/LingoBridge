import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING, normalizeHex, deriveBackgroundPalette } from '../constants/theme';

const PRESETS = [
  '#FFFFFF', '#FEF3C7', '#DCFCE7', '#DBEAFE', '#FCE7F3', '#EDE9FE', '#FFEDD5', '#E2E8F0',
  '#1E293B', '#0F172A', '#000000', '#14532D', '#4C1D95', '#7F1D1D', '#134E4A',
];

// value: '#RRGGBB' or null (= use the Light/Dark theme background); onChange(hex | null)
const BackgroundColorPicker = ({ value, onChange }) => {
  const [text, setText] = useState(value || '');
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(value || '');
    setInvalid(false);
  }, [value]);

  const handleText = (input) => {
    setText(input);
    if (!input.trim()) {
      setInvalid(false);
      return;
    }
    const hex = normalizeHex(input);
    setInvalid(!hex && input.trim().length >= 4);
    if (hex) onChange(hex);
  };

  const preview = deriveBackgroundPalette(value);

  return (
    <View>
      <View style={styles.swatchRow}>
        <TouchableOpacity
          style={[styles.swatch, styles.defaultSwatch, !value && styles.swatchSelected]}
          onPress={() => onChange(null)}
          accessibilityRole="radio"
          accessibilityState={{ selected: !value }}
          accessibilityLabel="Theme default background"
        >
          <Ionicons name="ban-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {PRESETS.map((hex) => {
          const selected = value === hex;
          const checkColor = deriveBackgroundPalette(hex).scheme === 'dark' ? '#FFFFFF' : '#000000';
          return (
            <TouchableOpacity
              key={hex}
              style={[styles.swatch, { backgroundColor: hex }, selected && styles.swatchSelected]}
              onPress={() => onChange(hex)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Background ${hex}`}
            >
              {selected && <Ionicons name="checkmark" size={18} color={checkColor} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Custom color (hex)</Text>
      <TextInput
        style={[styles.input, invalid && styles.inputInvalid]}
        value={text}
        onChangeText={handleText}
        placeholder="#FDE68A"
        placeholderTextColor={COLORS.textLight}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={7}
      />
      {invalid && <Text style={styles.error}>Enter a color like #FDE68A.</Text>}

      {preview && (
        <View style={[styles.preview, { backgroundColor: preview.overrides.background }]}>
          <View style={[styles.previewCard, { backgroundColor: preview.overrides.card, borderColor: preview.overrides.border }]}>
            <Text style={{ color: preview.scheme === 'dark' ? '#F1F5F9' : '#1E293B', fontWeight: '600' }}>
              Preview
            </Text>
            <Text style={{ color: preview.scheme === 'dark' ? '#A8B5C7' : '#64748B', fontSize: 13 }}>
              Text color adjusts so it stays readable.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.base },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultSwatch: { backgroundColor: COLORS.white },
  swatchSelected: { borderWidth: 3, borderColor: COLORS.primary },
  label: { ...FONTS.small, marginBottom: SPACING.xs },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
  },
  inputInvalid: { borderColor: COLORS.error },
  error: { ...FONTS.tiny, color: COLORS.error, marginTop: SPACING.xs },
  preview: { marginTop: SPACING.base, padding: SPACING.base, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  previewCard: { padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1 },
});

export default BackgroundColorPicker;
