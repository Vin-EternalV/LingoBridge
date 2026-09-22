// src/navigation/LearnerStack.js
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

const Stack = createNativeStackNavigator();

const LearnerStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* MainTabs MUST be first — it's the default landing screen */}
      <Stack.Screen name="MainTabs" component={LearnerTabs} />
      <Stack.Screen name="Survey" component={SurveyScreen} />
      <Stack.Screen name="TopicSelection" component={TopicSelectionScreen} />
      <Stack.Screen name="Exercise" component={ExerciseScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="SessionSummary" component={SessionSummaryScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
    </Stack.Navigator>
  );
};

export default LearnerStack;
