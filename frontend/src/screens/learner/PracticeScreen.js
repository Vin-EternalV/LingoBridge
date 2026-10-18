import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import Card from "../../components/Card";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";
import { AREAS } from "../../constants/learningOptions";

const SKILL_ICONS = {
  grammar: "book",
  vocabulary: "text",
  reading: "newspaper",
  writing: "pencil",
  speaking: "mic",
};
const SKILL_COLORS = {
  grammar: COLORS.primary,
  vocabulary: "#8B5CF6",
  reading: "#10B981",
  writing: "#F59E0B",
  speaking: "#EC4899",
};

const PracticeScreen = ({ navigation }) => {
  const start = (skill) =>
    navigation.navigate("TopicSelection", { skill, difficulty: "medium" });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Practice" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Choose a skill to practise. We'll generate exercises tailored to your
          level.
        </Text>

        {AREAS.map((area) => (
          <Card
            key={area.id}
            style={styles.card}
            onPress={() => start(area.id)}
          >
            <View
              style={[
                styles.icon,
                { backgroundColor: `${SKILL_COLORS[area.id]}20` },
              ]}
            >
              <Ionicons
                name={SKILL_ICONS[area.id] || "book"}
                size={24}
                color={SKILL_COLORS[area.id]}
              />
            </View>
            <View style={styles.text}>
              <Text style={styles.title}>{area.title}</Text>
              <Text style={styles.desc}>{area.description}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textLight}
            />
          </Card>
        ))}

        <Card
          style={styles.historyCard}
          onPress={() => navigation.navigate("History")}
        >
          <Ionicons name="time-outline" size={20} color={COLORS.primary} />
          <Text style={styles.historyText}>View practice history</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.base, paddingBottom: SPACING.xxl },
  intro: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  card: { flexDirection: "row", alignItems: "center", padding: SPACING.base },
  icon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, marginLeft: SPACING.base },
  title: { ...FONTS.h4 },
  desc: { ...FONTS.small, marginTop: 2 },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
    marginTop: SPACING.base,
    gap: SPACING.sm,
  },
  historyText: {
    ...FONTS.regular,
    fontWeight: "600",
    color: COLORS.primary,
    flex: 1,
  },
});

export default PracticeScreen;
