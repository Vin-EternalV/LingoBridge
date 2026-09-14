import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const ChatBubble = ({ message, isUser }) => {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {!isUser && (
        <View style={styles.aiIconContainer}>
          <Ionicons name="sparkles" size={14} color={COLORS.white} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SPACING.base,
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  aiIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginBottom: 2,
  },
  bubble: {
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    ...FONTS.regular,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.white,
  },
  aiText: {
    color: COLORS.text,
  },
});

export default ChatBubble;
