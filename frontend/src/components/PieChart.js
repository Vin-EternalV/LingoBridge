import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const PALETTE = ['#163832', '#8B5CF6', '#F59E0B', '#0EA5E9', '#EC4899', '#10B981'];
const polar = (cx, cy, radius, angle) => ({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
const segmentPath = (cx, cy, radius, start, end) => {
  const first = polar(cx, cy, radius, start);
  const last = polar(cx, cy, radius, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${first.x} ${first.y} A ${radius} ${radius} 0 ${largeArc} 1 ${last.x} ${last.y} Z`;
};

const PieChart = ({ title, data = [], emptyMessage = 'No data available.' }) => {
  const [selected, setSelected] = useState(null);
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const slices = useMemo(() => {
    if (!total) return [];
    let angle = -Math.PI / 2;
    return data.filter((item) => Number(item.value) > 0).map((item, index) => {
      const sweep = (item.value / total) * Math.PI * 2;
      const slice = { ...item, start: angle, end: angle + sweep, color: item.color || PALETTE[index % PALETTE.length] };
      angle += sweep;
      return slice;
    });
  }, [data, total]);
  const active = slices[selected] || null;

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      {!total ? <Text style={styles.empty}>{emptyMessage}</Text> : <>
        <View style={styles.chartWrap}>
          <Svg width={190} height={190} viewBox="0 0 190 190" accessibilityLabel={title}>
            {slices.map((slice, index) => slice.end - slice.start > Math.PI * 1.99 ? (
              <Circle key={`${slice.label}-${index}`} cx={95} cy={95} r={86} fill={slice.color} stroke={COLORS.card} strokeWidth={2} onPress={() => setSelected(index)} />
            ) : (
              <Path key={`${slice.label}-${index}`} d={segmentPath(95, 95, 86, slice.start, slice.end)} fill={slice.color} stroke={COLORS.card} strokeWidth={2} onPress={() => setSelected(index)} />
            ))}
            <Circle cx={95} cy={95} r={49} fill={COLORS.card} pointerEvents="none" />
          </Svg>
          <View pointerEvents="none" style={styles.center}>
            <Text style={styles.centerValue}>{active ? active.value : total}</Text>
            <Text style={styles.centerLabel}>{active ? active.label : 'Total'}</Text>
          </View>
        </View>
        <View style={styles.legend}>
          {slices.map((slice, index) => (
            <Text key={`${slice.label}-legend-${index}`} onPress={() => setSelected(index)} style={[styles.legendItem, selected === index && styles.legendSelected]}>
              <Text style={{ color: slice.color }}>● </Text>{slice.label}: {slice.value} ({Math.round((slice.value / total) * 100)}%)
            </Text>
          ))}
        </View>
      </>}
    </View>
  );
};

const styles = StyleSheet.create({
  title: { ...FONTS.h3, marginBottom: SPACING.md },
  empty: { ...FONTS.small, paddingVertical: SPACING.md },
  chartWrap: { width: 190, height: 190, alignSelf: 'center', marginVertical: SPACING.sm },
  center: { position: 'absolute', top: 64, left: 54, width: 82, height: 62, alignItems: 'center', justifyContent: 'center' },
  centerValue: { ...FONTS.h3, fontSize: 21 },
  centerLabel: { ...FONTS.tiny, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center', marginTop: SPACING.sm },
  legendItem: { ...FONTS.small, paddingVertical: 4 },
  legendSelected: { fontWeight: '700', color: COLORS.text },
});

export default PieChart;
