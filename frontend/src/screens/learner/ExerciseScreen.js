import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import ExerciseRenderer from '../../components/ExerciseRenderer';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

// Mock generator since we don't have a backend yet
const mockGenerateExercises = (skill, topic) => {
  return [
    {
      id: '1',
      type: 'multiple_choice',
      question: `Which word best fits the sentence: "I went ___ the store"?`,
      options: ['to', 'at', 'in', 'on'],
      correctAnswer: 'to',
      explanation: 'We use "to" when expressing direction or destination.'
    },
    {
      id: '2',
      type: 'fill_in_blank',
      sentence: 'She ___ to the market every Saturday.',
      hint: 'Present tense of go for third person singular.',
      correctAnswer: 'goes',
      explanation: 'The subject "She" requires the third-person singular form "goes".'
    }
  ];
};

const ExerciseScreen = ({ route, navigation }) => {
  const { skill, topic, difficulty, exercises: savedExercises, currentIndex = 0, scoreInfo } = route.params;
  const [exercises, setExercises] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (savedExercises?.length) {
      setExercises(savedExercises);
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      const generated = mockGenerateExercises(skill, topic);
      setExercises(generated);
      setLoading(false);
    }, 1000);
  }, [skill, topic, savedExercises]);

  const handleQuit = () => {
    Alert.alert(
      "Quit Session", 
      "Are you sure you want to quit? Your progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Quit", style: "destructive", onPress: () => navigation.navigate('Practice') }
      ]
    );
  };

  const handleSubmit = () => {
    if (!userAnswer) return;

    const currentExercise = exercises[currentIndex];
    
    // Evaluate answer (mock evaluation)
    const isCorrect = typeof userAnswer === 'string' 
      ? userAnswer.toLowerCase().trim() === currentExercise.correctAnswer.toLowerCase().trim()
      : false;

    const feedback = {
      isCorrect,
      correctAnswer: currentExercise.correctAnswer,
      explanation: currentExercise.explanation,
      userAnswer,
      example: 'I go to school. She goes to the market.',
      suggestion: 'Review present simple rules for he/she/it.'
    };

    navigation.navigate('Feedback', {
      exercise: currentExercise,
      feedback,
      currentIndex,
      totalExercises: exercises.length,
      skill,
      topic,
      difficulty,
      exercises, // passing along for the flow
      scoreInfo: scoreInfo || { correct: 0, total: 0 }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header 
          title="Loading Practice..." 
          showBack={false}
          rightComponent={<Text style={styles.quitText} onPress={handleQuit}>Quit</Text>} 
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Generating AI exercises for {topic}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises[currentIndex];
  const progress = (currentIndex) / exercises.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
        title={`${skill.charAt(0).toUpperCase() + skill.slice(1)} Practice`} 
        showBack={false}
        rightComponent={<Text style={styles.quitText} onPress={handleQuit}>Quit</Text>} 
      />
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Question {currentIndex + 1} of {exercises.length}</Text>
        <ProgressBar progress={progress} showLabel={false} height={6} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ExerciseRenderer 
          exercise={currentExercise}
          userAnswer={userAnswer}
          onChangeAnswer={setUserAnswer}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Submit Answer" 
          onPress={handleSubmit} 
          disabled={!userAnswer}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  quitText: {
    ...FONTS.regular,
    color: COLORS.error,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  footer: {
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default ExerciseScreen;
