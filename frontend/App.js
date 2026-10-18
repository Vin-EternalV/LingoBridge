import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "./src/constants/theme";
import { initAppearance } from "./src/utils/appearance";

export default function App() {
  const [appearance, setAppearance] = useState(null);

  useEffect(() => {
    initAppearance().then(setAppearance);
  }, []);

  if (!appearance) return null;

  const AppNavigator = require("./src/navigation/AppNavigator").default;
  const { AuthProvider } = require("./src/contexts/AuthContext");
  const DialogHost = require("./src/components/DialogHost").default;
  const {
    default: BackgroundLayer,
    setBackgroundImageState,
  } = require("./src/components/BackgroundLayer");
  setBackgroundImageState(appearance.backgroundImageUri, appearance.backgroundImage?.text);
  const isDark = appearance.scheme === "dark";

  const navTheme = {
    dark: isDark,
    colors: {
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.white,
      text: COLORS.text,
      border: COLORS.border,
      notification: COLORS.error,
    },
  };

  return (
    <SafeAreaProvider>
      <BackgroundLayer
        uri={appearance.backgroundImageUri}
        text={appearance.backgroundImage?.text}
      >
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <AppNavigator />
            <DialogHost />
            <StatusBar style={isDark ? "light" : "dark"} />
          </NavigationContainer>
        </AuthProvider>
      </BackgroundLayer>
    </SafeAreaProvider>
  );
}
