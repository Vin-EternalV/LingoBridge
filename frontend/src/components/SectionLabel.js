import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const SectionLabel = ({ children, hint }) => (
  <>
    <Text style={styles.label}>{children}</Text>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </>
);

const styles = StyleSheet.create({
  label: {
    ...FONTS.h4,
    color: COLORS.text,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
  },
  hint: {
    ...FONTS.small,
    marginBottom: SPACING.md,
  },
});

export default SectionLabel;
