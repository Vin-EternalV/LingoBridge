import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { getSessionDetail } from "../../api/progress";
import { getResumeSessionParams } from "../../utils/practiceSession";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";

const HistoryDetailScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSessionDetail(sessionId)
      .then(setSession)
      .catch((e) =>
        setError(e.response?.data?.message || "Unable to load this session."),
      );
  }, [sessionId]);

  if (!session && !error) {
    return <LoadingSpinner fullScreen message="Loading session..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Session Summary" showBack />
        <EmptyState
          title="Session unavailable"
          description={error}
          icon="alert-circle-outline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Session Summary" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.summary}>
          <Text style={styles.topic}>{session.topic}</Text>
          <Text style={styles.muted}>
            {new Date(
              session.completedAt || session.createdAt,
            ).toLocaleString()}
          </Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.stat}>{session.accuracy}%</Text>
              <Text style={styles.label}>Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.stat}>
                {session.correctAnswers}/{session.totalQuestions}
              </Text>
              <Text style={styles.label}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.stat}>{session.duration || 0} min</Text>
              <Text style={styles.label}>Time</Text>
            </View>
          </View>
        </Card>

        {session.status === "in_progress" && (
          <Button
            title="Continue Session"
            fullWidth
            style={styles.continueButton}
            onPress={() => navigation.navigate("Exercise", getResumeSessionParams(session))}
          />
        )}

        <Text style={styles.heading}>Exercises</Text>
        {(session.exercises || []).map((entry, index) => {
          const exercise = entry.exerciseData || {};
          return (
            <Card key={index} style={styles.exercise}>
              <View style={styles.row}>
                <Text style={styles.question}>Question {index + 1}</Text>
                <Badge
                  text={entry.isCorrect ? "Correct" : "Incorrect"}
                  variant={entry.isCorrect ? "success" : "error"}
                />
              </View>
              <Text style={styles.text}>
                {exercise.question || exercise.prompt || "Question unavailable"}
              </Text>
              <Text style={styles.muted}>
                Your answer: {String(entry.userAnswer || "No answer")}
              </Text>
              {!entry.isCorrect && (
                <Text style={styles.correct}>
                  Correct answer:{" "}
                  {String(
                    entry.feedback?.correctAnswer ||
                      exercise.correctAnswer ||
                      "—",
                  )}
                </Text>
              )}
              {!!entry.feedback?.explanation && (
                <Text style={styles.feedback}>
                  {entry.feedback.explanation}
                </Text>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  summary: { padding: SPACING.xl, alignItems: "center" },
  continueButton: { marginTop: SPACING.base },
  topic: { ...FONTS.h3, textAlign: "center" },
  muted: { ...FONTS.small, marginTop: 4 },
  stats: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
  },
  statItem: { flex: 1, alignItems: "center" },
  stat: { ...FONTS.h3, color: COLORS.primaryDark },
  label: { ...FONTS.small },
  heading: { ...FONTS.h4, marginVertical: SPACING.base },
  exercise: { padding: SPACING.base },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  question: { ...FONTS.small, color: COLORS.textSecondary },
  text: { ...FONTS.regular, marginBottom: SPACING.sm },
  correct: { ...FONTS.small, color: COLORS.success, marginTop: 4 },
  feedback: {
    ...FONTS.small,
    color: COLORS.primaryDark,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primaryLighter,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
});

export default HistoryDetailScreen;
