import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

// "STEP 2" plus a row of dots, shown at the right of the onboarding header.
const StepDots = ({ step, total = 4 }) => (
  <View style={styles.row} accessibilityLabel={`Step ${step} of ${total}`}>
    <Text style={styles.label}>STEP {step}</Text>
    {Array.from({ length: total }, (_, i) => (
      <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.text, marginRight: SPACING.xs, letterSpacing: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary },
});

export default StepDots;
