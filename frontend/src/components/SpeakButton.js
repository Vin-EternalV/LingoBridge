import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speak, stopSpeaking, NORMAL_RATE, SLOW_RATE } from '../utils/speech';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

// A speaker button: tap to hear the text, tap again to stop.
// slow: also shows a "Slow" button that reads the text more slowly (useful for pronunciation practice).
const SpeakButton = ({ text, size = 20, slow = false, style }) => {
  const [mode, setMode] = useState(null); // null | 'normal' | 'slow'
  const modeRef = useRef(null);
  const mounted = useRef(true);

  const update = (next) => {
    modeRef.current = next;
    if (mounted.current) setMode(next);
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (modeRef.current) stopSpeaking(); // leaving the screen stops this button's speech only
    };
  }, []);

  if (!text || !String(text).trim()) return null;

  const play = (next) => {
    if (modeRef.current === next) {
      stopSpeaking();
      return;
    }
    // speak() first stops whatever was playing (which resets that button), then we mark this one as active.
    speak(text, { rate: next === 'slow' ? SLOW_RATE : NORMAL_RATE, onEnd: () => update(null) });
    update(next);
  };

  const boxSize = size + 14;

  return (
    <View style={[styles.row, style]}>
      <TouchableOpacity
        style={[styles.button, { width: boxSize, height: boxSize }, mode === 'normal' && styles.active]}
        onPress={() => play('normal')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={mode === 'normal' ? 'Stop listening' : 'Listen to pronunciation'}
      >
        <Ionicons
          name={mode === 'normal' ? 'stop' : 'volume-high'}
          size={size}
          color={mode === 'normal' ? COLORS.onPrimary : COLORS.primary}
        />
      </TouchableOpacity>

      {slow && (
        <TouchableOpacity
          style={[styles.slowButton, mode === 'slow' && styles.active]}
          onPress={() => play('slow')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={mode === 'slow' ? 'Stop listening' : 'Listen slowly'}
        >
          <Ionicons
            name={mode === 'slow' ? 'stop' : 'volume-low'}
            size={14}
            color={mode === 'slow' ? COLORS.onPrimary : COLORS.primary}
          />
          <Text style={[styles.slowText, mode === 'slow' && styles.slowTextActive]}>Slow</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  button: {
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: COLORS.primary },
  slowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  slowText: { ...FONTS.tiny, color: COLORS.primary, fontWeight: '600' },
  slowTextActive: { color: COLORS.onPrimary },
});

export default SpeakButton;
