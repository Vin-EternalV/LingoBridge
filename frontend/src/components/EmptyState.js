import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const EmptyState = ({ icon = 'folder-open-outline', title, description, actionTitle, onAction }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={COLORS.primaryLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionTitle && onAction && (
        <Button 
          title={actionTitle} 
          onPress={onAction} 
          variant="outline" 
          style={styles.button} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    flex: 1,
  },
  iconContainer: {
    marginBottom: SPACING.base,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  description: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  button: {
    minWidth: 150,
  },
});

export default EmptyState;
