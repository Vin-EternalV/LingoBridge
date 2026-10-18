import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const Chip = ({ label, selected = false, onPress, style }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.selected, style]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityState={{ selected }}
  >
    <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  selected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  text: {
    ...FONTS.small,
    color: COLORS.text,
    fontWeight: '500',
  },
  selectedText: {
    color: COLORS.onPrimary,
    fontWeight: '600',
  },
});

export default Chip;
