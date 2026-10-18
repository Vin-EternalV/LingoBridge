import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const levels = [
  { id: 'beginner', title: 'Beginner', description: "I'm just starting to learn English" },
  { id: 'elementary', title: 'Elementary', description: "I know basic words and phrases" },
  { id: 'intermediate', title: 'Intermediate', description: "I can have simple conversations" },
  { id: 'upper_intermediate', title: 'Upper Intermediate', description: "I'm fairly comfortable with English" },
  { id: 'advanced', title: 'Advanced', description: "I'm fluent but want to improve" },
];

const EnglishLevelScreen = ({ navigation }) => {
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleContinue = () => {
    if (selectedLevel) {
      navigation.navigate('LearningGoals', { level: selectedLevel });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressContainer}>
        <ProgressBar progress={0.25} showLabel={false} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>What's your English level?</Text>
          <Text style={styles.description}>This helps us personalize your learning experience.</Text>
        </View>

        <View style={styles.optionsContainer}>
          {levels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.card,
                selectedLevel === level.id && styles.selectedCard
              ]}
              onPress={() => setSelectedLevel(level.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.cardTitle,
                selectedLevel === level.id && styles.selectedText
              ]}>
                {level.title}
              </Text>
              <Text style={[
                styles.cardDescription,
                selectedLevel === level.id && styles.selectedText
              ]}>
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          disabled={!selectedLevel}
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
  optionsContainer: {
    gap: SPACING.base,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
  },
  cardTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDescription: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  selectedText: {
    color: COLORS.primaryDark,
  },
  footer: {
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default EnglishLevelScreen;
