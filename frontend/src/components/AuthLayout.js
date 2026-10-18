import React from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { COLORS, SPACING } from "../constants/theme";

const AuthLayout = ({ children, maxWidth = 440 }) => (
  <KeyboardAvoidingView
    style={styles.kav}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
  >
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { maxWidth }]}>{children}</View>
    </ScrollView>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  card: { width: "100%", alignSelf: "center" },
});

export default AuthLayout;
