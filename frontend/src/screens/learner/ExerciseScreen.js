import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Button from "../../components/Button";
import Header from "../../components/Header";
import ProgressBar from "../../components/ProgressBar";
import ExerciseRenderer from "../../components/ExerciseRenderer";
import ErrorMessage from "../../components/ErrorMessage";
import { confirmAction } from "../../utils/dialog";
import {
  generateExercises,
  submitAnswer,
} from "../../api/practice";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const ExerciseScreen = ({ route, navigation }) => {
  const {
    skill,
    topic,
    difficulty,
    isCustomTopic = false,
    exercises: savedExercises,
    sessionId: savedSessionId,
    currentIndex = 0,
    scoreInfo,
    startedAt,
    elapsedBefore = 0,
    answers = [],
  } = route.params;

  const [exercises, setExercises] = useState(savedExercises || []);
  const exercise = exercises[currentIndex];
  const [sessionId, setSessionId] = useState(savedSessionId);
  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(!savedExercises?.length);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const timeLimit = ({ easy: 30, medium: 20, hard: 15 })[String(difficulty || "medium").toLowerCase()] || 20;
  const [secondsLeft, setSecondsLeft] = useState(timeLimit);
  const [questionStartedAt, setQuestionStartedAt] = useState(startedAt || Date.now());

  useEffect(() => {
    if (!exercise) return undefined;
    const timer = setInterval(() => setSecondsLeft((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => clearInterval(timer);
  }, [currentIndex, exercises.length, timeLimit, loading]);

  // A timeout leaves the previous question in its submitting state. Reset all
  // per-question state when Feedback advances back to this screen.
  useEffect(() => {
    setUserAnswer("");
    setSubmitting(false);
    setError("");
    setSecondsLeft(timeLimit);
    setQuestionStartedAt(startedAt || Date.now());
  }, [currentIndex, timeLimit, startedAt]);

  useEffect(() => {
    if (secondsLeft === 0 && exercise && !submitting) {
      setSubmitting(true);
      submitAnswer({ sessionId, index: currentIndex, userAnswer: 'Time expired' }).then((result) => navigation.navigate("Feedback", {
        levelAdvanced: result.levelAdvanced,
        feedback: { ...result.feedback, userAnswer: 'Time expired', timedOut: true },
        exercise, currentIndex, totalExercises: exercises.length, skill, topic, difficulty, exercises,
        sessionId, scoreInfo: scoreInfo || { correct: 0, total: 0 }, startedAt: questionStartedAt, answers,
        elapsedBefore,
      })).catch((requestError) => {
        setError(requestError.response?.data?.message || 'Could not save the timed answer. Please try again.');
        setSecondsLeft(timeLimit);
        setSubmitting(false);
      });
    }
  }, [secondsLeft]);

  useEffect(() => {
    const startSession = async () => {
      if (savedExercises?.length) return;
      try {
        setError("");
        const generated = await generateExercises({
          skill,
          topic,
          difficulty,
          isCustomTopic,
          count: ({ easy: 5, medium: 8, hard: 10 })[String(difficulty || "medium").toLowerCase()] || 8,
        });
        const list = generated.exercises || generated;
        setExercises(list);
        setSessionId(generated.sessionId || savedSessionId);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Unable to generate a practice session. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };
    startSession();
  }, [skill, topic, difficulty, savedExercises]);

  const handleSubmit = async () => {
    if (!userAnswer.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    const exercise = exercises[currentIndex];
    try {
      const result = await submitAnswer({ sessionId, index: currentIndex, userAnswer });
      const feedback = { ...result.feedback, userAnswer };
      navigation.navigate("Feedback", {
        levelAdvanced: result.levelAdvanced,
        feedback: { ...feedback, userAnswer },
        exercise,
        currentIndex,
        totalExercises: exercises.length,
        skill,
        topic,
        difficulty,
        exercises,
        sessionId,
        scoreInfo: scoreInfo || { correct: 0, total: 0 },
        startedAt: questionStartedAt,
        elapsedBefore,
        answers,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to evaluate your answer. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const quit = async () => {
    const confirmed = await confirmAction(
      "Quit Session",
      "Your session will remain in your history as unfinished.",
      { confirmText: "Quit", destructive: true },
    );
    if (confirmed) navigation.navigate("MainTabs", { screen: "PracticeTab" });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Loading Practice..." showBack={false} />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>
            Creating personalized exercises...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !exercises.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Practice" showBack />
        <View style={styles.loading}>
          <ErrorMessage message={error} />
          <Button
            title="Try Again"
            onPress={() =>
              navigation.replace("Exercise", { skill, topic, difficulty, isCustomTopic })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`${skill.charAt(0).toUpperCase() + skill.slice(1)} Practice`}
        showBack={false}
        rightComponent={
          <Text style={styles.quit} onPress={quit}>
            Quit
          </Text>
        }
      />
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {exercises.length}
        </Text>
        <Text style={styles.progressText}>Time remaining: {secondsLeft}s</Text>
        <ProgressBar
          progress={currentIndex / exercises.length}
          showLabel={false}
          height={6}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <ErrorMessage message={error} />
        <ExerciseRenderer
          exercise={exercise}
          userAnswer={userAnswer}
          onChangeAnswer={setUserAnswer}
          disabled={submitting}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={submitting ? "Checking Answer..." : "Submit Answer"}
          onPress={handleSubmit}
          disabled={!userAnswer.trim() || submitting}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  loadingText: { ...FONTS.regular, color: COLORS.textSecondary },
  quit: { ...FONTS.regular, color: COLORS.error, fontWeight: "600" },
  progress: {
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
  content: {
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
