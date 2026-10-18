import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import SkillCard from "../../components/SkillCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusMessage from "../../components/StatusMessage";
import { getProgress, getHistory } from "../../api/progress";
import { getSuggestions } from "../../api/ai";
import { getMySurvey } from "../../api/survey";
import { getErrorMessage } from "../../utils/errors";
import { timeAgo, currentStreak, titleCase } from "../../utils/format";
import { AREAS, TOPICS_BY_SKILL, levelLabel } from "../../constants/learningOptions";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";

const SKILL_IDS = AREAS.map((area) => area.id);
// Two columns: the first holds three skills, the second two.
const SKILL_COLUMNS = [
  ["grammar", "reading", "writing"],
  ["vocabulary", "speaking"],
];

const accuracyOf = (progress, skill) => progress?.skillProgress?.[skill]?.accuracy || 0;

// Daily review skill: the one the learner scores lowest on; before any practice, their preferred
// area, then the survey's hardest skill, then grammar.
const pickReviewSkill = (progress, suggestions, profile) => {
  const practiced = SKILL_IDS.filter((id) => (progress?.skillProgress?.[id]?.totalSessions || 0) > 0);
  if (practiced.length) {
    return [...practiced].sort((a, b) => accuracyOf(progress, a) - accuracyOf(progress, b))[0];
  }
  const preferred = (profile?.preferredAreas || []).find((id) => SKILL_IDS.includes(id));
  if (preferred) return preferred;
  return SKILL_IDS.includes(suggestions?.weakestSkill) ? suggestions.weakestSkill : "grammar";
};

// Rotates through the skill's topics day by day so the daily review is not always the same.
const dailyTopic = (skill) => {
  const topics = TOPICS_BY_SKILL[skill] || [];
  if (!topics.length) return "Daily Review";
  return topics[Math.floor(Date.now() / 86400000) % topics.length];
};

const DashboardScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const firstName = user?.firstName || "Learner";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [hasSurvey, setHasSurvey] = useState(null);

  // Each request is independent, so one failing (for example the AI suggestions) never blanks the page.
  const loadData = useCallback(async () => {
    const [progressRes, historyRes, suggestionsRes, surveyRes] = await Promise.allSettled([
      getProgress(),
      getHistory({ limit: 5 }),
      getSuggestions(),
      getMySurvey(),
    ]);
    refreshUser().catch(() => {}); // keeps the level shown below in step with Learning Profile edits

    if (progressRes.status === "fulfilled") setProgress(progressRes.value);
    if (historyRes.status === "fulfilled") setSessions(historyRes.value?.data || []);
    if (suggestionsRes.status === "fulfilled") setSuggestions(suggestionsRes.value);
    if (surveyRes.status === "fulfilled") {
      setHasSurvey(!!surveyRes.value);
    } else if (surveyRes.reason?.response?.status === 404) {
      setHasSurvey(false); // 404 means "no survey submitted yet"; other errors keep the card hidden
    }

    if (progressRes.status === "rejected" && historyRes.status === "rejected") {
      setError(getErrorMessage(progressRes.reason, "Could not load your dashboard."));
    } else {
      setError(null);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const profile = user?.profile;
  const level = levelLabel(profile?.englishLevel);
  const streak = currentStreak(progress?.streak);
  const totalSessions = progress?.totalPracticeSessions || 0;
  const overallAccuracy = progress?.overallAccuracy || 0;

  const startPractice = (skill, topic, difficulty = "medium") =>
    navigation.navigate("Exercise", { skill, topic, difficulty });

  const goToProgress = () => navigation.navigate("ProgressTab");

  // Continue Learning: repeat the most recent session's skill and topic.
  const lastSession = sessions[0];
  const reviewSkill = pickReviewSkill(progress, suggestions, profile);
  const continueAction = lastSession
    ? {
        title: "Continue Learning",
        desc: `${titleCase(lastSession.skill)}: ${lastSession.topic}`,
        onPress: () => startPractice(lastSession.skill, lastSession.topic, lastSession.difficulty || "medium"),
      }
    : {
        title: "Start Learning",
        desc: "Pick your first topic",
        onPress: () => navigation.navigate("TopicSelection", { skill: reviewSkill, difficulty: "medium" }),
      };

  const quickTopic = dailyTopic(reviewSkill);
  const recommendation = suggestions?.suggestions?.[0];
  const recentSessions = sessions.filter((session) => session.status !== "abandoned").slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner fullScreen message="Loading your dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hello, {firstName}! 👋</Text>
            <Text style={styles.subGreeting}>
              {streak > 0 ? `You're on a ${streak}-day streak. Keep it going!` : "Ready to learn English today?"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.streakContainer}
            onPress={() => navigation.navigate("GoalsProgress")}
            accessibilityRole="button"
            accessibilityLabel={`${streak} day streak. Open goals and progress`}
          >
            <Ionicons name="flame" size={20} color={COLORS.warning} />
            <Text style={styles.streakText}>{streak}</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <>
            <StatusMessage type="error" message={error} />
            <TouchableOpacity onPress={onRefresh} style={styles.retry}>
              <Text style={styles.link}>Try again</Text>
            </TouchableOpacity>
          </>
        )}

        {hasSurvey === false && (
          <Card style={styles.surveyCard} onPress={() => navigation.navigate("Survey")}>
            <View style={styles.surveyRow}>
              <View style={styles.surveyIcon}>
                <Ionicons name="clipboard" size={24} color={COLORS.onPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.surveyTitle}>Take the Learning Survey</Text>
                <Text style={styles.surveyDesc}>Get AI recommendations tailored to your difficulties.</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={COLORS.onPrimary} />
            </View>
          </Card>
        )}

        {recommendation && (
          <Card
            style={styles.recCard}
            onPress={() => startPractice(recommendation.skill, recommendation.topic)}
          >
            <View style={styles.recHeader}>
              <Ionicons name="sparkles" size={20} color={COLORS.warning} />
              <Text style={styles.recLabel}>AI Recommendation</Text>
            </View>
            <Text style={styles.recTitle}>{recommendation.topic}</Text>
            <Text style={styles.recDesc}>{recommendation.reason}</Text>
          </Card>
        )}

        <Card style={styles.progressCard} onPress={goToProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Overall Progress</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </View>
          <ProgressBar
            progress={overallAccuracy / 100}
            showLabel={true}
            label={level ? `${level} Level · Accuracy` : "Overall Accuracy"}
          />
          <Text style={styles.progressCaption}>
            {totalSessions > 0
              ? `${totalSessions} ${totalSessions === 1 ? "session" : "sessions"} completed`
              : "Complete your first practice session to see your progress."}
          </Text>
        </Card>

        <View style={styles.actionCardsContainer}>
          <Card style={styles.actionCard} onPress={continueAction.onPress}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="play" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{continueAction.title}</Text>
              <Text style={styles.actionDesc} numberOfLines={2}>{continueAction.desc}</Text>
            </View>
          </Card>

          <Card style={styles.actionCard} onPress={() => startPractice(reviewSkill, quickTopic)}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="flash" size={24} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Quick Practice</Text>
              <Text style={styles.actionDesc} numberOfLines={2}>
                5 questions · {titleCase(reviewSkill)}
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.skillsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Skills</Text>
            <Text style={styles.link} onPress={goToProgress}>
              See all
            </Text>
          </View>
          <View style={styles.skillsGrid}>
            {SKILL_COLUMNS.map((column, index) => (
              <View key={index} style={styles.skillColumn}>
                {column.map((skill) => (
                  <SkillCard
                    key={skill}
                    skill={titleCase(skill)}
                    progress={accuracyOf(progress, skill) / 100}
                    onPress={() => navigation.navigate("TopicSelection", { skill, difficulty: "medium" })}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.link} onPress={() => navigation.navigate("History")}>
              View history
            </Text>
          </View>
          {recentSessions.length === 0 ? (
            <Card style={styles.recentCard}>
              <View style={styles.recentIcon}>
                <Ionicons name="time-outline" size={24} color={COLORS.textLight} />
              </View>
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle}>No activity yet</Text>
                <Text style={styles.recentTime}>Your completed practice sessions will show up here.</Text>
              </View>
            </Card>
          ) : (
            recentSessions.map((session) => {
              const done = session.status === "completed";
              return (
                <Card
                  key={session._id}
                  style={styles.recentCard}
                  onPress={() => navigation.navigate("HistoryDetail", { sessionId: session._id })}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons
                      name={done ? "checkmark-circle" : "time-outline"}
                      size={24}
                      color={done ? COLORS.success : COLORS.warning}
                    />
                  </View>
                  <View style={styles.recentContent}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {done ? "Completed" : "Unfinished"}: {session.topic}
                    </Text>
                    <Text style={styles.recentTime}>
                      {timeAgo(session.completedAt || session.createdAt)}
                      {done && session.totalQuestions
                        ? ` · ${session.correctAnswers}/${session.totalQuestions} correct`
                        : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.base,
  },
  headerText: { flex: 1, paddingRight: SPACING.md },
  greeting: { ...FONTS.h2, color: COLORS.text },
  subGreeting: { ...FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  streakText: {
    ...FONTS.h4,
    color: COLORS.warning,
    marginLeft: 4,
    fontWeight: "bold",
  },
  retry: { alignSelf: "flex-start", marginBottom: SPACING.base },
  surveyCard: { backgroundColor: COLORS.primary, marginBottom: SPACING.base },
  surveyRow: { flexDirection: "row", alignItems: "center" },
  surveyIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.base,
  },
  surveyTitle: { ...FONTS.h4, color: COLORS.onPrimary },
  surveyDesc: { ...FONTS.small, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  recCard: {
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.warning,
    marginBottom: SPACING.base,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  recLabel: {
    ...FONTS.small,
    color: COLORS.warningText,
    fontWeight: "bold",
    marginLeft: 6,
  },
  recTitle: { ...FONTS.h4, color: COLORS.text },
  recDesc: { ...FONTS.small, color: COLORS.warningTextStrong, marginTop: 4 },
  progressCard: { marginBottom: SPACING.xl },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
  progressCaption: { ...FONTS.small, marginTop: SPACING.sm },
  sectionTitle: { ...FONTS.h3, color: COLORS.text },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
  link: { ...FONTS.small, color: COLORS.primary, fontWeight: "600" },
  actionCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  actionCard: { width: "48%", marginBottom: 0 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  actionContent: { marginTop: SPACING.xs },
  actionTitle: { ...FONTS.h4, color: COLORS.text },
  actionDesc: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  skillsSection: { marginBottom: SPACING.xl },
  skillsGrid: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  skillColumn: { width: "48%" },
  recentSection: { marginBottom: SPACING.base },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
  },
  recentIcon: { marginRight: SPACING.base },
  recentContent: { flex: 1 },
  recentTitle: { ...FONTS.regular, fontWeight: "600", color: COLORS.text },
  recentTime: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
});

export default DashboardScreen;
