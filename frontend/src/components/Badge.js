import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const Badge = ({ text, variant = 'info' }) => {
  const getStyle = () => {
    switch (variant) {
      case 'success':
        return { bg: COLORS.successLight, text: COLORS.success };
      case 'warning':
        return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'error':
        return { bg: COLORS.errorLight, text: COLORS.error };
      case 'info':
      default:
        return { bg: COLORS.primaryLight, text: COLORS.primaryDark };
    }
  };

  const style = getStyle();

  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...FONTS.tiny,
    fontWeight: 'bold',
  },
});

export default Badge;
