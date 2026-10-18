import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

// Compact, dependency-free chart for dashboard data. Each row keeps its exact value visible.
const AnalyticsBarChart = ({ title, data = [], color = COLORS.primary, emptyMessage = 'No activity in this period.' }) => {
  const max = Math.max(1, ...data.map((item) => Number(item.value) || 0));
  return (
    <View accessibilityLabel={title}>
      <Text style={styles.title}>{title}</Text>
      {!data.length || data.every((item) => !item.value) ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : data.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${Math.max(3, ((Number(item.value) || 0) / max) * 100)}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  title: { ...FONTS.h3, marginBottom: SPACING.md },
  empty: { ...FONTS.small, paddingVertical: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
  label: { ...FONTS.small, width: 76 },
  track: { flex: 1, height: 10, borderRadius: 8, backgroundColor: COLORS.border, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 8 },
  value: { ...FONTS.small, fontWeight: '600', width: 32, textAlign: 'right' },
});

export default AnalyticsBarChart;
