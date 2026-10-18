import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

// Speak instead of typing, on web browsers that support it (Chrome and Edge do).
// On phones this renders nothing: use the microphone on the phone's own keyboard instead.
const Recognition =
  Platform.OS === 'web' && typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const DictationButton = ({ onText, lang = 'en-US' }) => {
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);

  // Leaving the screen (or changing question) switches the microphone off.
  useEffect(
    () => () => {
      try {
        recognition.current?.stop();
      } catch (e) {
        // already stopped
      }
    },
    []
  );

  if (!Recognition) return null;

  const toggle = () => {
    if (listening) {
      try {
        recognition.current?.stop();
      } catch (e) {
        setListening(false);
      }
      return;
    }
    try {
      const rec = new Recognition();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          if (event.results[i].isFinal) {
            const heard = String(event.results[i][0].transcript || '').trim();
            if (heard) onText(heard);
          }
        }
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognition.current = rec;
      rec.start();
      setListening(true);
    } catch (e) {
      setListening(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      style={[styles.button, listening && styles.active]}
      accessibilityRole="button"
      accessibilityLabel={listening ? 'Stop dictation' : 'Start dictation'}
      activeOpacity={0.7}
    >
      <Ionicons name={listening ? 'stop' : 'mic'} size={18} color={listening ? COLORS.onPrimary : COLORS.primary} />
      <Text style={[styles.text, listening && { color: COLORS.onPrimary }]}>{listening ? 'Listening... tap to stop' : 'Speak your answer'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  active: { backgroundColor: COLORS.error },
  text: { ...FONTS.small, color: COLORS.primary, fontWeight: '600' },
});

export default DictationButton;
