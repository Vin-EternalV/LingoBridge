import React from "react";
import { withBackground } from "../components/BackgroundLayer";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import VerifyOtpScreen from "../screens/auth/VerifyOtpScreen";
import AdminSetupScreen from "../screens/auth/AdminSetupScreen";
import LegalDocumentScreen from "../screens/legal/LegalDocumentScreen";
import { COLORS } from "../constants/theme";

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: Platform.OS !== "web",
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={withBackground(WelcomeScreen)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={withBackground(LoginScreen)}
        options={{ title: "Log In" }}
      />
      <Stack.Screen
        name="Register"
        component={withBackground(RegisterScreen)}
        options={{ title: "Create Account" }}
      />
      <Stack.Screen name="LegalDocument" component={withBackground(LegalDocumentScreen)} options={{ title: "Legal information" }} />
      <Stack.Screen
        name="VerifyOtp"
        component={withBackground(VerifyOtpScreen)}
        options={{ title: "Verify Your Email" }}
      />
      <Stack.Screen
        name="AdminSetup"
        component={withBackground(AdminSetupScreen)}
        options={{ title: "Set Up Administrator Account" }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={withBackground(ForgotPasswordScreen)}
        options={{ title: "Reset Password" }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={withBackground(ResetPasswordScreen)}
        options={{ title: "Enter Reset Code" }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
