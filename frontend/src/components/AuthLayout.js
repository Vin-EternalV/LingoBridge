import React from "react";
import { Ionicons } from "@expo/vector-icons";
import AppearanceToggle from "./AppearanceToggle";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { COLORS, SPACING } from "../constants/theme";

const AuthLayout = ({ children, maxWidth = 560, title, subtitle }) => (
  <KeyboardAvoidingView
    style={styles.kav}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
  >
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { maxWidth }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandIdentity}>
            <View style={styles.brandMark}><Ionicons name="book" size={20} color="#FFFFFF" /></View>
            <Text style={styles.brandName}>LingoBridge</Text>
          </View>
          <AppearanceToggle />
        </View>
        {!!title && <Text style={styles.title}>{title}</Text>}
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: "transparent" },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    paddingVertical: 28,
  },
  card: {
    width: "100%", alignSelf: "center", backgroundColor: COLORS.card,
    borderRadius: 24, borderWidth: 1, borderColor: COLORS.border,
    padding: 30, shadowColor: "#183B34", shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 4,
  },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.sm, marginBottom: 26 },
  brandIdentity: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  brandMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginRight: 10 },
  brandName: { fontSize: 21, fontWeight: "600", color: COLORS.text },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, marginBottom: 24 },
});

export default AuthLayout;
