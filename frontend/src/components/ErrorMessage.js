import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={24} color={COLORS.error} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
  },
  message: {
    ...FONTS.small,
    color: COLORS.error,
    flex: 1,
    marginLeft: SPACING.sm,
  },
  retryButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  retryText: {
    ...FONTS.small,
    color: COLORS.error,
    fontWeight: '600',
  },
});

export default ErrorMessage;
