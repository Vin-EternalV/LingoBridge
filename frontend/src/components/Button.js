import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}) => {
  const getContainerStyle = () => {
    const styles = [defaultStyles.container];
    
    if (fullWidth) styles.push(defaultStyles.fullWidth);
    
    switch (variant) {
      case 'secondary':
        styles.push(defaultStyles.secondaryContainer);
        break;
      case 'outline':
        styles.push(defaultStyles.outlineContainer);
        break;
      case 'text':
        styles.push(defaultStyles.textContainer);
        break;
      case 'danger':
        styles.push(defaultStyles.dangerContainer);
        break;
      case 'primary':
      default:
        styles.push(defaultStyles.primaryContainer);
        break;
    }

    if (disabled) {
      styles.push(defaultStyles.disabledContainer);
    }

    if (style) styles.push(style);
    return styles;
  };

  const getTextStyle = () => {
    const styles = [defaultStyles.text];
    
    switch (variant) {
      case 'secondary':
      case 'outline':
      case 'text':
        styles.push({ color: COLORS.primary });
        break;
      case 'danger':
      case 'primary':
      default:
        styles.push({ color: COLORS.white });
        break;
    }

    if (disabled && variant !== 'primary' && variant !== 'danger') {
      styles.push({ color: COLORS.textLight });
    } else if (disabled) {
      styles.push({ color: COLORS.white });
    }

    return styles;
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? COLORS.white : COLORS.primary} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const defaultStyles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  primaryContainer: {
    backgroundColor: COLORS.primary,
  },
  secondaryContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  textContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  dangerContainer: {
    backgroundColor: COLORS.error,
  },
  disabledContainer: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  text: {
    ...FONTS.h4,
    textAlign: 'center',
  },
});

export default Button;
