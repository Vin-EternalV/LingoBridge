import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

const Avatar = ({ name, imageUrl, size = 48 }) => {
  const getInitials = (nameStr) => {
    if (!nameStr) return '?';
    const parts = nameStr.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (imageUrl) {
    return (
      <Image 
        source={{ uri: imageUrl }} 
        style={[styles.container, containerStyle]} 
      />
    );
  }

  return (
    <View style={[styles.container, styles.placeholder, containerStyle]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: COLORS.primaryLight,
  },
  initials: {
    ...FONTS.h3,
    color: COLORS.primaryDark,
    fontWeight: 'bold',
  },
});

export default Avatar;
