// src/screens/learner/SurveyScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import Header from "../../components/Header";
import ErrorMessage from "../../components/ErrorMessage";
import { submitSurvey } from "../../api/survey";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";

const SKILLS = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "reading", label: "Reading" },
  { key: "speaking", label: "Speaking" },
  { key: "writing", label: "Writing" },
];

const FREQUENCIES = [
  { key: "never", label: "Never" },
  { key: "rarely", label: "Rarely" },
  { key: "weekly", label: "Weekly" },
  { key: "several_times_week", label: "Several times a week" },
  { key: "daily", label: "Daily" },
];

const SurveyScreen = ({ navigation }) => {
  const [difficulty, setDifficulty] = useState({
    grammar: 3,
    vocabulary: 3,
    reading: 3,
    speaking: 3,
    writing: 3,
  });
  const [practiceFrequency, setPracticeFrequency] = useState("weekly");
  const [minutesPerSession, setMinutesPerSession] = useState("30");
  const [sessionsPerWeek, setSessionsPerWeek] = useState("3");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setSkillDifficulty = (skill, value) => {
    setDifficulty((prev) => ({ ...prev, [skill]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    const minutes = parseInt(minutesPerSession, 10);
    const sessions = parseInt(sessionsPerWeek, 10);

    if (!minutes || minutes < 1 || minutes > 600) {
      setError("Minutes per session must be between 1 and 600.");
      return;
    }
    if (!sessions || sessions < 1 || sessions > 50) {
      setError("Sessions per week must be between 1 and 50.");
      return;
    }

    setSubmitting(true);
    try {
      await submitSurvey({
        difficulty,
        practiceFrequency,
        minutesPerSession: minutes,
        sessionsPerWeek: sessions,
      });
      Alert.alert(
        "Survey submitted 🎉",
        "Thank you! Your AI recommendations will now be personalized.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Failed to submit survey. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Learning Survey" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.intro}>
          Help us personalize your learning. Rate how difficult each skill feels
          (1 = very easy, 5 = very hard).
        </Text>

        <ErrorMessage message={error} />

        {SKILLS.map(({ key, label }) => (
          <View key={key} style={styles.skillBlock}>
            <Text style={styles.skillLabel}>{label}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.ratingBtn,
                    difficulty[key] === n && styles.ratingBtnActive,
                  ]}
                  onPress={() => setSkillDifficulty(key, n)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.ratingText,
                      difficulty[key] === n && styles.ratingTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>How often do you practice?</Text>
        <View style={styles.chipsWrap}>
          {FREQUENCIES.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                practiceFrequency === key && styles.chipActive,
              ]}
              onPress={() => setPracticeFrequency(key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  practiceFrequency === key && styles.chipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Time spent practicing</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.inputLabel}>Minutes / session</Text>
            <TextInput
              style={styles.input}
              value={minutesPerSession}
              onChangeText={setMinutesPerSession}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={COLORS.textLight}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.inputLabel}>Sessions / week</Text>
            <TextInput
              style={styles.input}
              value={sessionsPerWeek}
              onChangeText={setSessionsPerWeek}
              keyboardType="number-pad"
              placeholder="3"
              placeholderTextColor={COLORS.textLight}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={submitting ? "Submitting..." : "Submit Survey"}
          onPress={handleSubmit}
          disabled={submitting}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  intro: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  skillBlock: { marginBottom: SPACING.base },
  skillLabel: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  ratingRow: { flexDirection: "row", gap: SPACING.sm },
  ratingBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  ratingText: { ...FONTS.h4, color: COLORS.textSecondary },
  ratingTextActive: { color: COLORS.primaryDark, fontWeight: "bold" },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  chipText: { ...FONTS.small, color: COLORS.text },
  chipTextActive: { color: COLORS.white, fontWeight: "600" },
  row: { flexDirection: "row", gap: SPACING.base },
  half: { flex: 1 },
  inputLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    ...FONTS.regular,
    color: COLORS.text,
  },
  footer: {
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default SurveyScreen;
