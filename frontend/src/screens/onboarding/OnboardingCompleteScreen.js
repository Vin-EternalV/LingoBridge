import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { updateOnboarding } from "../../api/users";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";

const OnboardingCompleteScreen = ({ route }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [finishing, setFinishing] = useState(false);
  const onboardingData = route.params;
  const { refreshUser } = useAuth();

  // Save the answers to the backend, but DON'T flip the auth flag here —
  // we want the learner to actually see this screen before we navigate away.
  useEffect(() => {
    let active = true;
    const saveOnboardingData = async () => {
      try {
        await updateOnboarding(onboardingData);
        if (active) setLoading(false);
      } catch (err) {
        console.error(err);
        if (active) {
          setError("We couldn't save your preferences. Check your connection and retry.");
          setLoading(false);
        }
      }
    };
    saveOnboardingData();
    return () => {
      active = false;
    };
  }, []);

  const handleStart = async () => {
    if (finishing) return;
    setFinishing(true);

    try {
      if (error) await updateOnboarding(onboardingData);
      // Re-fetch the profile so `user.profile.onboardingComplete` reflects
      // what the backend actually stored. AppNavigator will switch over
      // the moment that flag becomes true.
      await refreshUser();
    } catch (e) {
      setError("Your preferences could not be confirmed. Please retry before continuing.");
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Personalizing your experience...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="checkmark-circle"
              size={100}
              color={COLORS.success}
            />
          </View>

          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.description}>
            We've customized your curriculum based on your selections. Your starting level is locked; complete sessions to unlock higher levels.
          </Text>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Ionicons name="bar-chart" size={20} color={COLORS.primary} />
                <Text style={styles.summaryText}>
                  Level: {onboardingData?.level || "Set"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="flag" size={20} color={COLORS.primary} />
                <Text style={styles.summaryText}>
                  {onboardingData?.goals?.length || 0} Goals Set
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="book" size={20} color={COLORS.primary} />
                <Text style={styles.summaryText}>
                  {onboardingData?.areas?.length || 0} Focus Areas
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Button
            title={error ? "Retry saving" : "Start Learning"}
            onPress={handleStart}
            loading={finishing}
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    ...FONTS.h4,
    color: COLORS.text,
    marginTop: SPACING.base,
  },
  container: { flex: 1, justifyContent: "space-between" },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: { marginBottom: SPACING.xl },
  title: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: SPACING.base,
    textAlign: "center",
  },
  description: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xxl,
    lineHeight: 24,
  },
  errorText: {
    ...FONTS.regular,
    color: COLORS.error,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
  summaryText: {
    ...FONTS.h4,
    color: COLORS.text,
    marginLeft: SPACING.base,
    textTransform: "capitalize",
  },
  footer: { padding: SPACING.xl },
});

export default OnboardingCompleteScreen;
