import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Platform, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const WelcomeScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.centerOuter} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.brandMark}><Ionicons name="book" size={22} color="#FFFFFF" /></View>
            <Text style={styles.appName}>LingoBridge</Text>
            <Text style={styles.tagline}>
              Your AI-Powered English Learning Companion
            </Text>
          </View>

          <View style={[styles.hero, wide && styles.heroWide]}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>SPEAK · PRACTICE · GROW</Text>
              <Text style={styles.heroTitle}>Make English progress, one conversation at a time.</Text>
              <Text style={styles.heroDescription}>Build confidence with practice and guidance shaped around your learning needs.</Text>
              <View style={styles.footer}>
                <Button title="Get Started" onPress={() => navigation.navigate("Register")} fullWidth style={styles.mainButton} />
                <Button title="I already have an account" variant="text" onPress={() => navigation.navigate("Login")} fullWidth />
              </View>
            </View>
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationHalo}>
                <View style={styles.illustrationCircle}><Ionicons name="chatbubbles" size={78} color={COLORS.primary} /></View>
                <View style={styles.illustrationBadge}><Ionicons name="book" size={25} color="#FFFFFF" /></View>
              </View>
            </View>
          </View>

          <View style={[styles.featuresContainer, wide && styles.featuresWide]}>
            {[["sparkles", "Personalized AI tutoring", "Get help tailored to your goals", "#E4F3EE", "#163832"], ["stats-chart", "Track your progress", "See your skills grow over time", "#E8F0FC", "#3973C7"], ["book", "Interactive practice", "Learn through useful exercises", "#FBF1DA", "#B77718"]].map(([icon, title, caption, tint, color]) => (
              <View key={title} style={[styles.featureItem, wide && styles.featureWide]}>
                <View style={[styles.featureIconBox, { backgroundColor: tint }]}><Ionicons name={icon} size={23} color={color} /></View>
                <View style={styles.featureCopy}><Text style={styles.featureText}>{title}</Text><Text style={styles.featureCaption}>{caption}</Text></View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  centerOuter: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: 28,
    paddingTop: Platform.OS === "android" ? SPACING.xxl : SPACING.xl,
  },
  inner: {
    width: "100%",
    maxWidth: 1300,
  },
  header: { alignItems: "center", marginBottom: 28 },
  brandMark: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  appName: { ...FONTS.h1, color: COLORS.primary, marginBottom: 4 },
  tagline: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  hero: { backgroundColor: COLORS.card, borderRadius: 28, borderWidth: 1, borderColor: COLORS.border, padding: 28, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
  heroWide: { flexDirection: "row", alignItems: "center", paddingVertical: 38, paddingHorizontal: 52 },
  heroCopy: { flex: 1 },
  eyebrow: { fontSize: 13, fontWeight: "800", letterSpacing: 1.5, color: COLORS.primary, marginBottom: 16 },
  heroTitle: { fontSize: 28, lineHeight: 35, fontWeight: "700", color: COLORS.text, marginBottom: 10, maxWidth: 550 },
  heroDescription: { ...FONTS.regular, color: COLORS.textSecondary, lineHeight: 24, maxWidth: 540 },
  illustrationContainer: { alignItems: "center", justifyContent: "center", padding: 20 },
  illustrationHalo: { width: 190, height: 190, borderRadius: 100, backgroundColor: COLORS.primaryLighter, alignItems: "center", justifyContent: "center" },
  illustrationCircle: { width: 148, height: 148, borderRadius: 80, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  illustrationBadge: { position: "absolute", bottom: 9, left: 38, width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.primary, borderWidth: 4, borderColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  featuresContainer: { marginTop: 20, gap: 10 },
  featuresWide: { flexDirection: "row" },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  featureWide: { minWidth: 0 },
  featureIconBox: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 12 },
  featureCopy: { flex: 1 },
  featureText: { ...FONTS.regular, fontWeight: "600", color: COLORS.text },
  featureCaption: { ...FONTS.small, marginTop: 3 },
  footer: { marginTop: 18, maxWidth: 550 },
  mainButton: { marginBottom: SPACING.sm, borderRadius: 16 },
});

export default WelcomeScreen;
