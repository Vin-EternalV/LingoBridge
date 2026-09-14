import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Header from '../../components/Header';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const practiceTopics = [
  { id: 'grammar', title: 'Grammar', icon: 'book', description: 'Tenses, sentence structure, and rules', color: COLORS.primary },
  { id: 'vocabulary', title: 'Vocabulary', icon: 'text', description: 'New words and phrases', color: '#8B5CF6' },
  { id: 'reading', title: 'Reading', icon: 'newspaper', description: 'Comprehension exercises', color: '#10B981' },
  { id: 'writing', title: 'Writing', icon: 'pencil', description: 'Essay and email drafting', color: '#F59E0B' },
  { id: 'speaking', title: 'Speaking', icon: 'mic', description: 'Pronunciation and conversation', color: '#EC4899' },
];

const PracticeScreen = ({ navigation }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  const handleTopicSelect = (skillId) => {
    navigation.navigate('TopicSelection', { 
      skill: skillId, 
      difficulty: selectedDifficulty 
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Practice Skills" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Default Difficulty</Text>
          <View style={styles.difficultyContainer}>
            {['easy', 'medium', 'hard'].map((diff) => (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.difficultyBtn,
                  selectedDifficulty === diff && styles.difficultyBtnActive
                ]}
                onPress={() => setSelectedDifficulty(diff)}
              >
                <Text style={[
                  styles.difficultyText,
                  selectedDifficulty === diff && styles.difficultyTextActive
                ]}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Recommended Practice</Text>
          <Card 
            style={styles.recommendationCard}
            onPress={() => navigation.navigate('TopicSelection', { 
              skill: 'grammar', 
              difficulty: selectedDifficulty 
            })}
          >
            <View style={styles.recIconContainer}>
              <Ionicons name="sparkles" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.recContent}>
              <Text style={styles.recTitle}>Review Past & Present Tenses</Text>
              <Text style={styles.recDesc}>Personalized for your learning level</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Skill to Practice</Text>
          <View style={styles.grid}>
            {practiceTopics.map((topic) => (
              <Card 
                key={topic.id} 
                style={styles.card} 
                onPress={() => handleTopicSelect(topic.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${topic.color}20` }]}>
                  <Ionicons name={topic.icon} size={32} color={topic.color} />
                </View>
                <Text style={styles.cardTitle}>{topic.title}</Text>
                <Text style={styles.cardDesc}>{topic.description}</Text>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  difficultyContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  difficultyBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  difficultyBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  difficultyText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  difficultyTextActive: {
    color: COLORS.primaryDark,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
  },
  recIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  recContent: {
    flex: 1,
  },
  recTitle: {
    ...FONTS.regular,
    fontWeight: '600',
    color: COLORS.text,
  },
  recDesc: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    padding: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  cardTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  cardDesc: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default PracticeScreen;
