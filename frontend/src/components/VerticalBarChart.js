import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const VerticalBarChart = ({ title, data = [], color = COLORS.primary, emptyMessage = 'No activity in this period.' }) => {
  const max = Math.max(1, ...data.map((item) => Number(item.value) || 0));
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      {!data.length || data.every((item) => !item.value) ? <Text style={styles.empty}>{emptyMessage}</Text> : (
        <View style={styles.plot} accessibilityLabel={title}>
          <View style={styles.gridLines} pointerEvents="none">
            <View style={styles.gridLine} /><View style={styles.gridLine} /><View style={styles.gridLine} />
          </View>
          {data.map((item, index) => {
            const height = Math.max(3, (Number(item.value || 0) / max) * 110);
            return (
              <View key={`${item.label}-${index}`} style={styles.column} accessibilityLabel={`${item.label}: ${item.value}`}>
                <Text style={styles.value}>{item.value}</Text>
                <View style={styles.barSpace}><View style={[styles.bar, { height, backgroundColor: item.color || color }]} /></View>
                <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  title: { ...FONTS.h3, marginBottom: SPACING.md },
  empty: { ...FONTS.small, paddingVertical: SPACING.md },
  plot: { minHeight: 154, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border, position: 'relative' },
  gridLines: { position: 'absolute', left: 0, right: 0, top: 20, height: 110, justifyContent: 'space-between' },
  gridLine: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border, width: '100%' },
  column: { flex: 1, minWidth: 24, alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 },
  value: { ...FONTS.tiny, marginBottom: 3, fontSize: 10 },
  barSpace: { height: 110, justifyContent: 'flex-end', width: '66%', minWidth: 10, maxWidth: 32 },
  bar: { width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  label: { ...FONTS.tiny, marginTop: 5, height: 16, fontSize: 10, textAlign: 'center', width: '100%' },
});

export default VerticalBarChart;
