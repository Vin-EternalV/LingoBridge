import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const goals = [
  { id: 'grammar', title: 'Improve Grammar' },
  { id: 'vocabulary', title: 'Expand Vocabulary' },
  { id: 'communication', title: 'Improve Communication' },
  { id: 'writing', title: 'Improve Writing' },
  { id: 'overall', title: 'Improve Overall English' },
];

const LearningGoalsScreen = ({ navigation, route }) => {
  const [selectedGoals, setSelectedGoals] = useState([]);
  const previousData = route.params || {};

  const toggleGoal = (id) => {
    if (selectedGoals.includes(id)) {
      setSelectedGoals(selectedGoals.filter(goal => goal !== id));
    } else {
      setSelectedGoals([...selectedGoals, id]);
    }
  };

  const handleContinue = () => {
    navigation.navigate('PreferredAreas', { 
      ...previousData,
      goals: selectedGoals 
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressContainer}>
        <ProgressBar progress={0.5} showLabel={false} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>What are your learning goals?</Text>
          <Text style={styles.description}>Select all that apply to help us tailor your curriculum.</Text>
        </View>

        <View style={styles.optionsContainer}>
          {goals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.card,
                  isSelected && styles.selectedCard
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.cardTitle,
                  isSelected && styles.selectedText
                ]}>
                  {goal.title}
                </Text>
                <Ionicons 
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={24} 
                  color={isSelected ? COLORS.primary : COLORS.border} 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          disabled={selectedGoals.length === 0}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
  },
  cardTitle: {
    ...FONTS.h4,
    color: COLORS.text,
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

export default LearningGoalsScreen;
