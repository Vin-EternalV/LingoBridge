// src/navigation/LearnerStack.js
import { withBackground } from "../components/BackgroundLayer";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LearnerTabs from "./LearnerTabs";
import SurveyScreen from "../screens/learner/SurveyScreen";
import TopicSelectionScreen from "../screens/learner/TopicSelectionScreen";
import ExerciseScreen from "../screens/learner/ExerciseScreen";
import FeedbackScreen from "../screens/learner/FeedbackScreen";
import SessionSummaryScreen from "../screens/learner/SessionSummaryScreen";
import HistoryScreen from "../screens/learner/HistoryScreen";
import HistoryDetailScreen from "../screens/learner/HistoryDetailScreen";
import LearningProfileScreen from "../screens/profile/LearningProfileScreen";
import GoalsProgressScreen from "../screens/profile/GoalsProgressScreen";
import AccountSettingsScreen from "../screens/profile/AccountSettingsScreen";
import NotificationsScreen from "../screens/profile/NotificationsScreen";
import AppearanceScreen from "../screens/profile/AppearanceScreen";
import HelpSupportScreen from "../screens/profile/HelpSupportScreen";
import PrivacySecurityScreen from "../screens/profile/PrivacySecurityScreen";

const Stack = createNativeStackNavigator();

const LearnerStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* MainTabs MUST be first — it's the default landing screen */}
      <Stack.Screen name="MainTabs" component={withBackground(LearnerTabs)} />
      <Stack.Screen name="Survey" component={withBackground(SurveyScreen)} />
      <Stack.Screen name="TopicSelection" component={withBackground(TopicSelectionScreen)} />
      <Stack.Screen name="Exercise" component={withBackground(ExerciseScreen)} />
      <Stack.Screen name="Feedback" component={withBackground(FeedbackScreen)} />
      <Stack.Screen name="SessionSummary" component={withBackground(SessionSummaryScreen)} />
      <Stack.Screen name="History" component={withBackground(HistoryScreen)} />
      <Stack.Screen name="HistoryDetail" component={withBackground(HistoryDetailScreen)} />
      <Stack.Screen name="LearningProfile" component={withBackground(LearningProfileScreen)} />
      <Stack.Screen name="GoalsProgress" component={withBackground(GoalsProgressScreen)} />
      <Stack.Screen name="AccountSettings" component={withBackground(AccountSettingsScreen)} />
      <Stack.Screen name="Notifications" component={withBackground(NotificationsScreen)} />
      <Stack.Screen name="Appearance" component={withBackground(AppearanceScreen)} />
      <Stack.Screen name="HelpSupport" component={withBackground(HelpSupportScreen)} />
      <Stack.Screen name="PrivacySecurity" component={withBackground(PrivacySecurityScreen)} />
    </Stack.Navigator>
  );
};

export default LearnerStack;
