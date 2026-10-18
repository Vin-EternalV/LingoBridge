import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const difficultiesList = [
  { id: 'grammar_rules', title: 'Grammar rules' },
  { id: 'vocabulary', title: 'Vocabulary/word choice' },
  { id: 'reading', title: 'Reading comprehension' },
  { id: 'writing', title: 'Writing clearly' },
  { id: 'speaking', title: 'Speaking/pronunciation' },
  { id: 'sentence_structure', title: 'Sentence structure' },
  { id: 'tenses', title: 'Tenses' },
  { id: 'prepositions', title: 'Prepositions' },
  { id: 'articles', title: 'Articles (a, an, the)' },
];

const DifficultiesScreen = ({ navigation, route }) => {
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const previousData = route.params || {};

  const toggleDifficulty = (id) => {
    if (selectedDifficulties.includes(id)) {
      setSelectedDifficulties(selectedDifficulties.filter(diff => diff !== id));
    } else {
      setSelectedDifficulties([...selectedDifficulties, id]);
    }
  };

  const handleContinue = () => {
    navigation.navigate('OnboardingComplete', { 
      ...previousData,
      difficulties: selectedDifficulties 
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressContainer}>
        <ProgressBar progress={1} showLabel={false} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Which areas are challenging for you?</Text>
          <Text style={styles.description}>This helps our AI target your weak points.</Text>
        </View>

        <View style={styles.chipsContainer}>
          {difficultiesList.map((item) => {
            const isSelected = selectedDifficulties.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.chip,
                  isSelected && styles.selectedChip
                ]}
                onPress={() => toggleDifficulty(item.id)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={COLORS.primaryDark} style={styles.checkIcon} />
                )}
                <Text style={[
                  styles.chipText,
                  isSelected && styles.selectedChipText
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          disabled={selectedDifficulties.length === 0}
          fullWidth 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  selectedChipText: {
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  checkIcon: {
    marginRight: 4,
  },
  footer: {
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default DifficultiesScreen;
