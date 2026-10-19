import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Modal from "./Modal";
import Button from "./Button";
import { registerDialogHost } from "../utils/dialog";
import { COLORS, FONTS, SPACING } from "../constants/theme";

export default function DialogHost() {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  useEffect(() => {
    registerDialogHost({
      notify: (title, message) => setDialog({ mode: "notify", title, message }),
      confirm: (title, message, opts) =>
        new Promise((resolve) => {
          resolver.current = resolve;
          setDialog({ mode: "confirm", title, message, ...opts });
        }),
    });
  }, []);

  const close = (value) => {
    if (resolver.current) resolver.current(value);
    resolver.current = null;
    setDialog(null);
  };

  if (!dialog) return null;

  return (
    <Modal
      visible
      onClose={() => close(false)}
      title={dialog.title}
      size="sm"
      scrollable={false}
      footer={
        dialog.mode === "confirm" ? (
          <View style={styles.row}>
            <View style={styles.half}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => close(false)}
                fullWidth
                style={styles.actionButton}
              />
            </View>
            <View style={styles.half}>
              <Button
                title={dialog.confirmText || "Confirm"}
                variant={dialog.destructive ? "danger" : "primary"}
                onPress={() => close(true)}
                fullWidth
                numberOfLines={1}
                noWrap
                style={styles.actionButton}
              />
            </View>
          </View>
        ) : (
          <Button title="OK" onPress={() => close(true)} fullWidth />
        )
      }
    >
      <Text style={styles.message}>{dialog.message}</Text>
    </Modal>
  );
}

const styles = StyleSheet.create({
  message: { ...FONTS.regular, color: COLORS.text, lineHeight: 22 },
  row: { flexDirection: "row", gap: SPACING.sm, width: "100%" },
  half: { flex: 1 },
  actionButton: { height: 56, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, flexShrink: 1 },
});
