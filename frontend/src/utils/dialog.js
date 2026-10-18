import { Alert, Platform } from "react-native";

let webNotify = () => {};
let webConfirm = async () => false;

export const registerDialogHost = ({ notify: n, confirm: c }) => {
  webNotify = n;
  webConfirm = c;
};

export const notify = (title, message) => {
  if (Platform.OS === "web") return webNotify(title, message);
  Alert.alert(title, message);
};

export const confirmAction = (
  title,
  message,
  { confirmText = "Confirm", destructive = false } = {},
) => {
  if (Platform.OS === "web")
    return webConfirm(title, message, { confirmText, destructive });
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
};
