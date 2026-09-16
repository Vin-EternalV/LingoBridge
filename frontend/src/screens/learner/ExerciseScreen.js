import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import Button from '../../components/Button';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import ExerciseRenderer from '../../components/ExerciseRenderer';
import ErrorMessage from '../../components/ErrorMessage';
import { generateExercises, submitAnswer, createSession } from '../../api/practice';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const ExerciseScreen = ({ route, navigation }) => {
  const { skill, topic, difficulty, exercises: savedExercises, sessionId: savedSessionId, currentIndex = 0, scoreInfo, startedAt } = route.params;
  const [exercises, setExercises] = useState(savedExercises || []);
  const [sessionId, setSessionId] = useState(savedSessionId);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(!savedExercises?.length);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const startSession = async () => {
      if (savedExercises?.length) return;
      try {
        setError('');
        const generated = await generateExercises({ skill, topic, difficulty, count: 5 });
        const session = await createSession({ skill, topic, difficulty, exercises: generated.exercises || generated });
        setExercises(generated.exercises || generated);
        setSessionId(session._id);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to generate a practice session. Please try again.');
      } finally { setLoading(false); }
    };
    startSession();
  }, [skill, topic, difficulty, savedExercises]);

  const handleSubmit = async () => {
    if (!userAnswer.trim() || submitting) return;
    setSubmitting(true); setError('');
    const exercise = exercises[currentIndex];
    try {
      const feedback = await submitAnswer({ exercise, userAnswer });
      navigation.navigate('Feedback', {
        feedback: { ...feedback, userAnswer }, currentIndex, totalExercises: exercises.length, skill, topic, difficulty,
        exercises, sessionId, scoreInfo: scoreInfo || { correct: 0, total: 0 }, startedAt: startedAt || Date.now()
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to evaluate your answer. Please try again.');
    } finally { setSubmitting(false); }
  };

  const quit = () => Alert.alert('Quit Session', 'Your session will remain in your history as unfinished.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Quit', style: 'destructive', onPress: () => navigation.navigate('Practice') }
  ]);

  if (loading) return <SafeAreaView style={styles.safeArea}><Header title="Loading Practice..." showBack={false} /><View style={styles.loading}><Text style={styles.loadingText}>Creating personalized exercises...</Text></View></SafeAreaView>;
  if (error && !exercises.length) return <SafeAreaView style={styles.safeArea}><Header title="Practice" showBack /><View style={styles.loading}><ErrorMessage message={error} /><Button title="Try Again" onPress={() => navigation.replace('Exercise', { skill, topic, difficulty })} /></View></SafeAreaView>;

  const exercise = exercises[currentIndex];
  return <SafeAreaView style={styles.safeArea}>
    <Header title={`${skill.charAt(0).toUpperCase() + skill.slice(1)} Practice`} showBack={false} rightComponent={<Text style={styles.quit} onPress={quit}>Quit</Text>} />
    <View style={styles.progress}><Text style={styles.progressText}>Question {currentIndex + 1} of {exercises.length}</Text><ProgressBar progress={currentIndex / exercises.length} showLabel={false} height={6} /></View>
    <ScrollView contentContainerStyle={styles.content}><ErrorMessage message={error} /><ExerciseRenderer exercise={exercise} userAnswer={userAnswer} onChangeAnswer={setUserAnswer} disabled={submitting} /></ScrollView>
    <View style={styles.footer}><Button title={submitting ? 'Checking Answer...' : 'Submit Answer'} onPress={handleSubmit} disabled={!userAnswer.trim() || submitting} fullWidth /></View>
  </SafeAreaView>;
};

const styles = StyleSheet.create({ safeArea:{flex:1,backgroundColor:COLORS.background}, loading:{flex:1,justifyContent:'center',alignItems:'center',padding:SPACING.xl}, loadingText:{...FONTS.regular,color:COLORS.textSecondary}, quit:{...FONTS.regular,color:COLORS.error,fontWeight:'600'}, progress:{paddingHorizontal:SPACING.base,paddingVertical:SPACING.sm,backgroundColor:COLORS.white,borderBottomWidth:1,borderBottomColor:COLORS.border}, progressText:{...FONTS.small,color:COLORS.textSecondary,marginBottom:SPACING.xs}, content:{padding:SPACING.base,paddingTop:SPACING.xl,paddingBottom:SPACING.xxl}, footer:{padding:SPACING.base,backgroundColor:COLORS.white,borderTopWidth:1,borderTopColor:COLORS.border} });
export default ExerciseScreen;
