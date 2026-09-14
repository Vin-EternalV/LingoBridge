import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from './ProgressBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const getSkillIcon = (skillName) => {
  const name = skillName.toLowerCase();
  if (name.includes('grammar')) return 'book';
  if (name.includes('vocabulary')) return 'text';
  if (name.includes('reading')) return 'newspaper';
  if (name.includes('writing')) return 'pencil';
  if (name.includes('speaking')) return 'mic';
  return 'school';
};

const SkillCard = ({ skill, progress = 0, onPress, isSelected = false }) => {
  const iconName = getSkillIcon(skill);
  
  return (
    <TouchableOpacity 
      style={[
        styles.card,
        isSelected && styles.selectedCard
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={[
          styles.iconContainer,
          isSelected && styles.selectedIconContainer
        ]}>
          <Ionicons 
            name={iconName} 
            size={24} 
            color={isSelected ? COLORS.white : COLORS.primary} 
          />
        </View>
        <Text style={[
          styles.title,
          isSelected && styles.selectedTitle
        ]}>
          {skill}
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <ProgressBar 
          progress={progress} 
          color={isSelected ? COLORS.white : COLORS.primary} 
          height={6} 
        />
        <Text style={[
          styles.progressText,
          isSelected && styles.selectedProgressText
        ]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.light,
    marginBottom: SPACING.base,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    ...FONTS.h4,
    color: COLORS.text,
    flex: 1,
  },
  selectedTitle: {
    color: COLORS.white,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    width: 35,
    textAlign: 'right',
  },
  selectedProgressText: {
    color: COLORS.primaryLight,
  },
});

export default SkillCard;
