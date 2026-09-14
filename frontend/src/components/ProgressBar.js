import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

const ProgressBar = ({ progress = 0, color = COLORS.primary, height = 8, showLabel = false, label }) => {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    // Ensure progress is between 0 and 1
    const safeProgress = Math.min(Math.max(progress, 0), 1);
    animatedProgress.value = withTiming(safeProgress, { duration: 500 });
  }, [progress, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label || 'Progress'}</Text>
          <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
        </View>
      )}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View 
          style={[
            styles.fill, 
            { backgroundColor: color, borderRadius: height / 2 },
            animatedStyle
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    ...FONTS.small,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  percentText: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.text,
  },
  track: {
    width: '100%',
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

export default ProgressBar;
