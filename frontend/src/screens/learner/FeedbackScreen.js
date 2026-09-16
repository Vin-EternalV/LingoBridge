import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { updateSession } from '../../api/practice';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const FeedbackScreen = ({ route, navigation }) => {
  const { 
    feedback, 
    currentIndex, 
    totalExercises, 
    skill, 
    topic, 
    difficulty,
    exercises,
    scoreInfo,
    sessionId,
    startedAt,
    answers = []
  } = route.params;

  const isLastQuestion = currentIndex === totalExercises - 1;
  const newScoreInfo = {
    correct: scoreInfo.correct + (feedback.isCorrect ? 1 : 0),
    total: scoreInfo.total + 1
  };

  const [saving, setSaving] = useState(false);
  const currentAnswer = {
    exerciseData: route.params.exercise,
    userAnswer: feedback.userAnswer,
    isCorrect: feedback.isCorrect,
    score: feedback.score,
    feedback,
    answeredAt: new Date().toISOString()
  };
  const allAnswers = [...answers, currentAnswer];

  const handleNext = async () => {
    if (isLastQuestion) {
      setSaving(true);
      const duration = Math.max(1, Math.round((Date.now() - startedAt) / 60));
      try {
        await updateSession(sessionId, {
          exercises: allAnswers,
          correctAnswers: newScoreInfo.correct,
          totalQuestions: newScoreInfo.total,
          score: Math.round((newScoreInfo.correct / newScoreInfo.total) * 100),
          accuracy: Math.round((newScoreInfo.correct / newScoreInfo.total) * 100),
          duration,
          status: 'completed',
          completedAt: new Date().toISOString()
        });
      } catch (error) {
        setSaving(false);
        return;
      }
      navigation.navigate('SessionSummary', {
        skill,
        topic,
        difficulty,
        scoreInfo: newScoreInfo,
        duration: `${duration} min`,
        sessionId
      });
    } else {
      navigation.navigate('Exercise', {
        skill,
        topic,
        difficulty,
        exercises,
          currentIndex: currentIndex + 1,
          scoreInfo: newScoreInfo,
          sessionId,
          startedAt,
          answers: allAnswers
      });
    }
  };

  return (
    <SafeAreaView style={[
      styles.safeArea, 
      { backgroundColor: feedback.isCorrect ? COLORS.successLight : COLORS.errorLight }
    ]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.statusHeader}>
          <Ionicons 
            name={feedback.isCorrect ? "checkmark-circle" : "close-circle"} 
            size={80} 
            color={feedback.isCorrect ? COLORS.success : COLORS.error} 
          />
          <Text style={[
            styles.statusTitle, 
            { color: feedback.isCorrect ? COLORS.success : COLORS.error }
          ]}>
            {feedback.isCorrect ? 'Excellent!' : 'Not quite right'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Answer:</Text>
          <Text style={[
            styles.answerText,
            { color: feedback.isCorrect ? COLORS.success : COLORS.error }
          ]}>
            {feedback.userAnswer}
          </Text>

          {!feedback.isCorrect && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Correct Answer:</Text>
              <Text style={[styles.answerText, { color: COLORS.success }]}>
                {feedback.correctAnswer}
              </Text>
            </>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Explanation:</Text>
          <Text style={styles.explanationText}>{feedback.explanation}</Text>
          
          {feedback.example && (
            <View style={styles.exampleBox}>
              <Text style={styles.exampleTitle}>Example:</Text>
              <Text style={styles.exampleText}>{feedback.example}</Text>
            </View>
          )}

          {!feedback.isCorrect && feedback.suggestion && (
            <View style={styles.suggestionBox}>
              <Ionicons name="bulb" size={20} color={COLORS.warning} />
              <Text style={styles.suggestionText}>{feedback.suggestion}</Text>
            </View>
          )}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={saving ? "Saving Session..." : isLastQuestion ? "Finish Session" : "Next Question"} 
          onPress={handleNext} 
          variant={feedback.isCorrect ? "primary" : "danger"}
          fullWidth disabled={saving}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.base,
    paddingTop: SPACING.xxl,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  statusTitle: {
    ...FONTS.h2,
    marginTop: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  answerText: {
    ...FONTS.h3,
    marginBottom: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.base,
  },
  explanationText: {
    ...FONTS.regular,
    color: COLORS.text,
    lineHeight: 24,
  },
  exampleBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginTop: SPACING.base,
  },
  exampleTitle: {
    ...FONTS.tiny,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exampleText: {
    ...FONTS.regular,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginTop: SPACING.base,
  },
  suggestionText: {
    ...FONTS.small,
    color: COLORS.warning,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  footer: {
    padding: SPACING.base,
    backgroundColor: 'transparent',
  },
});

export default FeedbackScreen;
