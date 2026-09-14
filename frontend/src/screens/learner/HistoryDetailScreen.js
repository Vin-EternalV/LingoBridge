import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const MOCK_EXERCISES = [
  {
    id: 'e1',
    question: 'Which word best fits: "I went ___ the store"?',
    userAnswer: 'to',
    correctAnswer: 'to',
    isCorrect: true,
    feedback: 'Correct! We use "to" for direction.',
  },
  {
    id: 'e2',
    question: 'Fill in the blank: "She ___ to the market."',
    userAnswer: 'go',
    correctAnswer: 'goes',
    isCorrect: false,
    feedback: 'Incorrect. Remember to use "goes" for third-person singular (she/he/it).',
  }
];

const HistoryDetailScreen = ({ route }) => {
  const { session } = route.params || {};

  // If coming from Summary, mapping might differ, handled abstractly here
  const topic = session?.topic || 'Session Details';
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Session Summary" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Card style={styles.summaryCard}>
          <Text style={styles.topicText}>{topic}</Text>
          <Text style={styles.dateText}>{session?.date || 'Just now'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{session?.score || 100}%</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{session?.duration || '0:00'}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{session?.questions || 2}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Exercises</Text>

        {MOCK_EXERCISES.map((exercise, index) => (
          <Card key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.questionNumber}>Question {index + 1}</Text>
              <Badge 
                text={exercise.isCorrect ? 'Correct' : 'Incorrect'} 
                variant={exercise.isCorrect ? 'success' : 'error'} 
              />
            </View>
            
            <Text style={styles.questionText}>{exercise.question}</Text>
            
            <View style={styles.answerBox}>
              <Text style={styles.answerLabel}>Your Answer:</Text>
              <Text style={[styles.answerText, { color: exercise.isCorrect ? COLORS.success : COLORS.error }]}>
                {exercise.userAnswer}
              </Text>
            </View>
            
            {!exercise.isCorrect && (
              <View style={styles.answerBox}>
                <Text style={styles.answerLabel}>Correct Answer:</Text>
                <Text style={[styles.answerText, { color: COLORS.success }]}>
                  {exercise.correctAnswer}
                </Text>
              </View>
            )}

            <View style={styles.feedbackBox}>
              <Ionicons name="chatbubbles-outline" size={16} color={COLORS.primary} style={styles.feedbackIcon} />
              <Text style={styles.feedbackText}>{exercise.feedback}</Text>
            </View>
          </Card>
        ))}

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
  summaryCard: {
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  topicText: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: 4,
  },
  dateText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.h3,
    color: COLORS.primaryDark,
  },
  statLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  exerciseCard: {
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  questionNumber: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  questionText: {
    ...FONTS.regular,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  answerBox: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  answerLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    width: 100,
  },
  answerText: {
    ...FONTS.regular,
    flex: 1,
    fontWeight: '500',
  },
  feedbackBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLighter,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  feedbackIcon: {
    marginRight: SPACING.xs,
    marginTop: 2,
  },
  feedbackText: {
    ...FONTS.small,
    color: COLORS.primaryDark,
    flex: 1,
  },
});

export default HistoryDetailScreen;
