import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

// Inline success / error banner. Pass message={null} to hide it.
const StatusMessage = ({ type = 'success', message }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <View style={[styles.box, isError ? styles.error : styles.success]}>
      <Ionicons
        name={isError ? 'alert-circle' : 'checkmark-circle'}
        size={20}
        color={isError ? COLORS.error : COLORS.success}
      />
      <Text style={[styles.text, { color: isError ? COLORS.error : COLORS.success }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
  },
  success: { backgroundColor: COLORS.successLight },
  error: { backgroundColor: COLORS.errorLight },
  text: { ...FONTS.small, flex: 1, marginLeft: SPACING.sm, fontWeight: '500' },
});

export default StatusMessage;
