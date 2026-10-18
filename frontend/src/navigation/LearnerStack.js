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
import IeltsWritingScreen from "../screens/learner/IeltsWritingScreen";
import IeltsWritingTaskScreen from "../screens/learner/IeltsWritingTaskScreen";
import IeltsWritingResultScreen from "../screens/learner/IeltsWritingResultScreen";
import IeltsSpeakingScreen from "../screens/learner/IeltsSpeakingScreen";
import IeltsSpeakingTaskScreen from "../screens/learner/IeltsSpeakingTaskScreen";
import IeltsSpeakingResultScreen from "../screens/learner/IeltsSpeakingResultScreen";
import IeltsReadingScreen from "../screens/learner/IeltsReadingScreen";
import IeltsReadingTaskScreen from "../screens/learner/IeltsReadingTaskScreen";
import IeltsReadingResultScreen from "../screens/learner/IeltsReadingResultScreen";
import IeltsProgressScreen from "../screens/learner/IeltsProgressScreen";
import IeltsMockScreen from "../screens/learner/IeltsMockScreen";
import IeltsListeningScreen from "../screens/learner/IeltsListeningScreen";
import IeltsListeningTaskScreen from "../screens/learner/IeltsListeningTaskScreen";
import IeltsListeningResultScreen from "../screens/learner/IeltsListeningResultScreen";
import AppGuideScreen from "../screens/learner/AppGuideScreen";
import LearningProfileScreen from "../screens/profile/LearningProfileScreen";
import GoalsProgressScreen from "../screens/profile/GoalsProgressScreen";
import AccountSettingsScreen from "../screens/profile/AccountSettingsScreen";
import NotificationsScreen from "../screens/profile/NotificationsScreen";
import AppearanceScreen from "../screens/profile/AppearanceScreen";
import HelpSupportScreen from "../screens/profile/HelpSupportScreen";
import PrivacySecurityScreen from "../screens/profile/PrivacySecurityScreen";
import LearningProgressScreen from "../screens/learner/LearningProgressScreen";
import IeltsVerificationScreen from "../screens/learner/IeltsVerificationScreen";

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
      <Stack.Screen name="IeltsWriting" component={withBackground(IeltsWritingScreen)} />
      <Stack.Screen name="IeltsWritingTask" component={withBackground(IeltsWritingTaskScreen)} />
      <Stack.Screen name="IeltsWritingResult" component={withBackground(IeltsWritingResultScreen)} />
      <Stack.Screen name="IeltsSpeaking" component={withBackground(IeltsSpeakingScreen)} />
      <Stack.Screen name="IeltsSpeakingTask" component={withBackground(IeltsSpeakingTaskScreen)} />
      <Stack.Screen name="IeltsSpeakingResult" component={withBackground(IeltsSpeakingResultScreen)} />
      <Stack.Screen name="IeltsReading" component={withBackground(IeltsReadingScreen)} />
      <Stack.Screen name="IeltsReadingTask" component={withBackground(IeltsReadingTaskScreen)} />
      <Stack.Screen name="IeltsReadingResult" component={withBackground(IeltsReadingResultScreen)} />
      <Stack.Screen name="IeltsProgress" component={withBackground(IeltsProgressScreen)} />
      <Stack.Screen name="IeltsMock" component={withBackground(IeltsMockScreen)} />
      <Stack.Screen name="IeltsListening" component={withBackground(IeltsListeningScreen)} />
      <Stack.Screen name="IeltsListeningTask" component={withBackground(IeltsListeningTaskScreen)} />
      <Stack.Screen name="IeltsListeningResult" component={withBackground(IeltsListeningResultScreen)} />
      <Stack.Screen name="AppGuide" component={withBackground(AppGuideScreen)} options={{ gestureEnabled: false }} />
      <Stack.Screen name="LearningProfile" component={withBackground(LearningProfileScreen)} />
      <Stack.Screen name="LearningProgress" component={withBackground(LearningProgressScreen)} />
      <Stack.Screen name="IeltsVerification" component={withBackground(IeltsVerificationScreen)} />
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
