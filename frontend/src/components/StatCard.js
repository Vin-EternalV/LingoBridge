import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const StatCard = ({ icon, label, value, trend, color = COLORS.primary }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend.isPositive ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={trend.isPositive ? COLORS.success : COLORS.error} 
            />
            <Text style={[
              styles.trendText, 
              { color: trend.isPositive ? COLORS.success : COLORS.error }
            ]}>
              {trend.value}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.light,
    flex: 1,
    minWidth: 140,
    marginHorizontal: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  trendText: {
    ...FONTS.tiny,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  content: {
    marginTop: SPACING.xs,
  },
  value: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: 4,
  },
  label: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
});

export default StatCard;
