import React from "react";
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS, SPACING } from "../constants/theme";

const Modal = ({
  visible,
  onClose,
  title,
  children,
  footer,
  size = "md",
  scrollable = true,
  showDividers = false,
}) => {
  const maxWidth = size === "sm" ? 360 : size === "lg" ? 720 : 480;
  const Body = scrollable ? ScrollView : View;
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { maxWidth }]}>
              <View style={[styles.header, !showDividers && styles.noHeaderDivider]}>
                <Text style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.close}
                  accessibilityLabel="Close"
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Body
                style={styles.body}
                contentContainerStyle={
                  scrollable ? styles.bodyContent : undefined
                }
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </Body>
              {footer ? <View style={[styles.footer, !showDividers && styles.noFooterDivider]}>{footer}</View> : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.base,
  },
  sheet: {
    width: "100%",
    maxHeight: Platform.OS === "web" ? "85vh" : "85%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noHeaderDivider: { borderBottomWidth: 0 },
  title: { ...FONTS.h4, flex: 1, paddingRight: SPACING.sm },
  close: { padding: SPACING.xs },
  body: { paddingHorizontal: SPACING.lg },
  bodyContent: { paddingVertical: SPACING.base },
  footer: {
    padding: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  noFooterDivider: { borderTopWidth: 0 },
});

export default Modal;
