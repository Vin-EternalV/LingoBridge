import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";

const SessionSummaryScreen = ({ route, navigation }) => {
  const { skill, topic, difficulty, scoreInfo, duration } = route.params || {};
  const safeScore = scoreInfo || { correct: 0, total: 0 };
  const skillTitle =
    (skill || "practice").charAt(0).toUpperCase() +
    (skill || "practice").slice(1);
  const percentage = safeScore.total
    ? Math.round((safeScore.correct / safeScore.total) * 100)
    : 0;

  const getTrophyColor = () => {
    if (percentage >= 80) return COLORS.warning;
    if (percentage >= 60) return "#94A3B8";
    return "#B45309";
  };

  // 'Dashboard', 'Practice' etc. are TABS inside MainTabs, not routes in LearnerStack.
  // Navigate to MainTabs first, then target the specific tab.
  const goToDashboard = () =>
    navigation.navigate("MainTabs", { screen: "Home" });

  const goToPractice = () =>
    navigation.navigate("MainTabs", { screen: "PracticeTab" });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="trophy" size={80} color={getTrophyColor()} />
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.subtitle}>
            Great job practicing your {skillTitle}
          </Text>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.tagsContainer}>
            <Badge text={skillTitle} variant="info" />
            <View style={{ width: 8 }} />
            <Badge text={difficulty || "medium"} variant="warning" />
          </View>

          <Text style={styles.topicName}>{topic || "Practice Session"}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{percentage}%</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {safeScore.correct}/{safeScore.total}
              </Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{duration || "—"}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Ionicons name="flame" size={24} color={COLORS.warning} />
            <Text style={styles.xpTitle}>+50 XP Earned</Text>
          </View>
          <Text style={styles.xpDesc}>
            Keep practicing daily to build your streak and unlock bonus XP.
          </Text>
        </Card>

        <Card style={styles.nextCard} onPress={goToPractice}>
          <View style={styles.nextRow}>
            <View style={styles.nextIcon}>
              <Ionicons name="refresh" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextTitle}>Practice another skill</Text>
              <Text style={styles.nextDesc}>
                Pick a new topic and keep the momentum going
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={COLORS.textLight}
            />
          </View>
        </Card>

        <Card
          style={styles.nextCard}
          onPress={() => navigation.navigate("History")}
        >
          <View style={styles.nextRow}>
            <View style={styles.nextIcon}>
              <Ionicons name="time" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextTitle}>Review your history</Text>
              <Text style={styles.nextDesc}>
                See all past practice sessions and detailed feedback
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={COLORS.textLight}
            />
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Back to Dashboard" onPress={goToDashboard} fullWidth />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.base },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.base,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
  },
  subtitle: { ...FONTS.regular, color: COLORS.textSecondary },
  statsCard: { marginBottom: SPACING.base, padding: SPACING.xl },
  tagsContainer: { flexDirection: "row", marginBottom: SPACING.sm },
  topicName: { ...FONTS.h3, color: COLORS.text, marginBottom: SPACING.xl },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { ...FONTS.h2, color: COLORS.primaryDark, marginBottom: 4 },
  statLabel: { ...FONTS.small, color: COLORS.textSecondary },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  xpCard: {
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.warning,
    marginBottom: SPACING.base,
  },
  xpHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  xpTitle: { ...FONTS.h4, color: "#B45309", marginLeft: SPACING.sm },
  xpDesc: { ...FONTS.small, color: "#92400E" },
  nextCard: { marginBottom: SPACING.base },
  nextRow: { flexDirection: "row", alignItems: "center" },
  nextIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.base,
  },
  nextTitle: { ...FONTS.h4, color: COLORS.text },
  nextDesc: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  footer: {
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default SessionSummaryScreen;
