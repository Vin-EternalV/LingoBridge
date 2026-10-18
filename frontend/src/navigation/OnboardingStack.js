import React from 'react';
import { withBackground } from "../components/BackgroundLayer";
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EnglishLevelScreen from '../screens/onboarding/EnglishLevelScreen';
import LearningGoalsScreen from '../screens/onboarding/LearningGoalsScreen';
import PreferredAreasScreen from '../screens/onboarding/PreferredAreasScreen';
import DifficultiesScreen from '../screens/onboarding/DifficultiesScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';
import StepDots from '../components/StepDots';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const Stack = createNativeStackNavigator();

const Brand = () => (
  <View style={styles.brand}>
    <Ionicons name="book" size={20} color={COLORS.primary} />
    <Text style={styles.brandText}>LingoBridge AI</Text>
  </View>
);

const stepOptions = (step) => ({
  title: `Step ${step} of 4`,
  headerTitle: () => <Brand />,
  headerTitleAlign: 'left',
  headerRight: () => <StepDots step={step} />,
});

const OnboardingStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="EnglishLevel" component={withBackground(EnglishLevelScreen)} options={stepOptions(1)} />
      <Stack.Screen name="LearningGoals" component={withBackground(LearningGoalsScreen)} options={stepOptions(2)} />
      <Stack.Screen name="PreferredAreas" component={withBackground(PreferredAreasScreen)} options={stepOptions(3)} />
      <Stack.Screen name="Difficulties" component={withBackground(DifficultiesScreen)} options={stepOptions(4)} />
      <Stack.Screen
        name="OnboardingComplete"
        component={withBackground(OnboardingCompleteScreen)}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  brandText: { ...FONTS.h4, color: COLORS.text },
});

export default OnboardingStack;
