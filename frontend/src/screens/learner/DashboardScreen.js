import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import SkillCard from "../../components/SkillCard";
import { getSuggestions } from "../../api/ai";
import { getMySurvey } from "../../api/survey";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const firstName = user?.firstName || "Learner";

  const [suggestions, setSuggestions] = useState(null);
  const [hasSurvey, setHasSurvey] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const survey = await getMySurvey().catch(() => null);
      setHasSurvey(!!survey);
    } catch {
      setHasSurvey(false);
    }
    try {
      const s = await getSuggestions();
      setSuggestions(s);
    } catch {
      // suggestions are optional
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Helper: navigate into a tab inside MainTabs
  const goToPractice = () => navigation.navigate("PracticeTab");
  const goToProgress = () => navigation.navigate("ProgressTab");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}! 👋</Text>
            <Text style={styles.subGreeting}>
              Ready to learn English today?
            </Text>
          </View>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={20} color={COLORS.warning} />
            <Text style={styles.streakText}>3</Text>
          </View>
        </View>

        {hasSurvey === false && (
          <Card
            style={styles.surveyCard}
            onPress={() => navigation.navigate("Survey")}
          >
            <View style={styles.surveyRow}>
              <View style={styles.surveyIcon}>
                <Ionicons name="clipboard" size={24} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.surveyTitle}>Take the Learning Survey</Text>
                <Text style={styles.surveyDesc}>
                  Get AI recommendations tailored to your difficulties.
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={COLORS.textLight}
              />
            </View>
          </Card>
        )}

        {suggestions?.suggestions?.[0] && (
          <Card
            style={styles.recCard}
            onPress={() =>
              navigation.navigate("TopicSelection", {
                skill: suggestions.suggestions[0].skill,
                difficulty: "medium",
              })
            }
          >
            <View style={styles.recHeader}>
              <Ionicons name="sparkles" size={20} color={COLORS.warning} />
              <Text style={styles.recLabel}>AI Recommendation</Text>
            </View>
            <Text style={styles.recTitle}>
              {suggestions.suggestions[0].topic}
            </Text>
            <Text style={styles.recDesc}>
              {suggestions.suggestions[0].reason}
            </Text>
          </Card>
        )}

        <Card style={styles.progressCard} onPress={goToProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Overall Progress</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textLight}
            />
          </View>
          <ProgressBar
            progress={0.35}
            showLabel={true}
            label="Intermediate Level"
          />
        </Card>

        <View style={styles.actionCardsContainer}>
          <Card style={styles.actionCard} onPress={goToPractice}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: COLORS.primaryLight },
              ]}
            >
              <Ionicons name="play" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Continue Learning</Text>
              <Text style={styles.actionDesc}>Grammar: Past Tense</Text>
            </View>
          </Card>

          <Card style={styles.actionCard} onPress={goToPractice}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: COLORS.successLight },
              ]}
            >
              <Ionicons name="flash" size={24} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Quick Practice</Text>
              <Text style={styles.actionDesc}>5 mins daily review</Text>
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
            <View style={styles.skillColumn}>
              <SkillCard
                skill="Grammar"
                progress={0.4}
                onPress={() =>
                  navigation.navigate("TopicSelection", {
                    skill: "grammar",
                    difficulty: "medium",
                  })
                }
              />
              <SkillCard
                skill="Reading"
                progress={0.6}
                onPress={() =>
                  navigation.navigate("TopicSelection", {
                    skill: "reading",
                    difficulty: "medium",
                  })
                }
              />
            </View>
            <View style={styles.skillColumn}>
              <SkillCard
                skill="Vocabulary"
                progress={0.5}
                onPress={() =>
                  navigation.navigate("TopicSelection", {
                    skill: "vocabulary",
                    difficulty: "medium",
                  })
                }
              />
              <SkillCard
                skill="Speaking"
                progress={0.2}
                onPress={() =>
                  navigation.navigate("TopicSelection", {
                    skill: "speaking",
                    difficulty: "medium",
                  })
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text
              style={styles.link}
              onPress={() => navigation.navigate("History")}
            >
              View history
            </Text>
          </View>
          <Card style={styles.recentCard}>
            <View style={styles.recentIcon}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={COLORS.success}
              />
            </View>
            <View style={styles.recentContent}>
              <Text style={styles.recentTitle}>Completed: Basic Greetings</Text>
              <Text style={styles.recentTime}>Yesterday</Text>
            </View>
          </Card>
          <Card style={styles.recentCard}>
            <View style={styles.recentIcon}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={COLORS.success}
              />
            </View>
            <View style={styles.recentContent}>
              <Text style={styles.recentTitle}>Vocab Quiz: 10/10</Text>
              <Text style={styles.recentTime}>2 days ago</Text>
            </View>
          </Card>
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
  surveyTitle: { ...FONTS.h4, color: COLORS.white },
  surveyDesc: { ...FONTS.small, color: COLORS.primaryLight, marginTop: 2 },
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
    color: "#92400E",
    fontWeight: "bold",
    marginLeft: 6,
  },
  recTitle: { ...FONTS.h4, color: COLORS.text },
  recDesc: { ...FONTS.small, color: "#78350F", marginTop: 4 },
  progressCard: { marginBottom: SPACING.xl },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
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
  skillsGrid: { flexDirection: "row", justifyContent: "space-between" },
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
