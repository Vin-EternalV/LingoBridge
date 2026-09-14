import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const Card = ({ children, style, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.light,
    marginBottom: SPACING.base,
  },
});

export default Card;
