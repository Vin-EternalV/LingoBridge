import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const Input = React.forwardRef(({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  icon,
  multiline,
  style,
  required,   // shows a red * after the label
  optional,   // shows "(optional)" after the label
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.requiredMark}> *</Text> : null}
          {optional ? <Text style={styles.optionalMark}> (optional)</Text> : null}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError
      ]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={isFocused ? COLORS.primary : COLORS.textLight} 
            style={styles.icon}
          />
        )}
        
        <TextInput
          ref={ref}
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={COLORS.textLight} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
    width: '100%',
  },
  label: {
    ...FONTS.small,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  requiredMark: {
    color: COLORS.error,
    fontWeight: '700',
  },
  optionalMark: {
    color: COLORS.textLight,
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  input: {
    flex: 1,
    ...FONTS.regular,
    color: COLORS.text,
    paddingVertical: SPACING.md,
    minHeight: 48,
    // The browser draws its own square focus outline inside our rounded box, which looks misaligned.
    // The rounded container already turns blue when focused, so the default outline is switched off on web.
    ...Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } }),
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    ...FONTS.tiny,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});

export default Input;
