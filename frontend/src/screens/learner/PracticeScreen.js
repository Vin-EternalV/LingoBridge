import React, { useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import Card from "../../components/Card";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";
import { AREAS } from "../../constants/learningOptions";
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

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
  const { user, refreshUser } = useAuth();
  useFocusEffect(useCallback(() => { refreshUser().catch(() => {}); }, []));
  const profile = user?.profile;
  const level = profile?.currentEnglishLevel || profile?.englishLevel;
  const dob = user?.dateOfBirth ? new Date(user.dateOfBirth) : null;
  const today = new Date();
  const age = dob ? today.getFullYear() - dob.getFullYear() - (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0) : null;
  const isAdult = age !== null && age >= 18;
  const ieltsUnlocked = level === 'advanced' && profile?.identityVerification?.status === 'verified';
  const start = (skill) => navigation.navigate("TopicSelection", { skill, difficulty: ({ beginner: 'easy', elementary: 'easy', intermediate: 'medium', upper_intermediate: 'medium', advanced: 'hard' })[level] || 'easy' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Practice" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Choose a skill to practise. We'll generate exercises tailored to your
          level.
        </Text>

        {isAdult && !ieltsUnlocked && <Card style={styles.card} onPress={() => level === 'advanced' ? navigation.navigate('IeltsVerification') : navigation.navigate('LearningProgress')}>
          <View style={[styles.icon, { backgroundColor: '#64748B20' }]}><Ionicons name="lock-closed" size={24} color={COLORS.textSecondary} /></View>
          <View style={styles.text}><Text style={styles.title}>IELTS preparation · Locked</Text><Text style={styles.desc}>{level !== 'advanced' ? 'Reach Advanced English to unlock IELTS preparation.' : 'Verify your age and identity to access IELTS preparation.'}</Text></View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </Card>}
        {ieltsUnlocked && <>
        <Card style={styles.card} onPress={() => navigation.navigate("IeltsListening")}>
          <View style={[styles.icon, { backgroundColor: "#06B6D420" }]}>
            <Ionicons name="headset" size={24} color="#0891B2" />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>IELTS Listening</Text>
            <Text style={styles.desc}>Listen to an original practice recording, answer questions, and review your score.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate("IeltsReading")}>
          <View style={[styles.icon, { backgroundColor: "#8B5CF620" }]}>
            <Ionicons name="book" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>IELTS Reading</Text>
            <Text style={styles.desc}>
              One passage, 13 questions in IELTS styles, marked instantly with explanations.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate("IeltsWriting")}>
          <View style={[styles.icon, { backgroundColor: "#0EA5E920" }]}>
            <Ionicons name="ribbon" size={24} color="#0EA5E9" />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>IELTS Writing</Text>
            <Text style={styles.desc}>
              Timed Task 1 and Task 2 practice, marked with an estimated band score.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate("IeltsSpeaking")}>
          <View style={[styles.icon, { backgroundColor: "#14B8A620" }]}>
            <Ionicons name="chatbubbles" size={24} color="#14B8A6" />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>IELTS Speaking</Text>
            <Text style={styles.desc}>
              Parts 1, 2 and 3 with a cue card, marked with an estimated band score.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate("IeltsProgress")}>
          <View style={[styles.icon, { backgroundColor: "#F59E0B20" }]}>
            <Ionicons name="stats-chart" size={24} color="#F59E0B" />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>IELTS mock test and progress</Text>
            <Text style={styles.desc}>
              Take a timed mock test, set a target band and track your estimated score.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </Card>
        </>}

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
