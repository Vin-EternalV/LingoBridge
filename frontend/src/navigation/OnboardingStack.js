import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EnglishLevelScreen from '../screens/onboarding/EnglishLevelScreen';
import LearningGoalsScreen from '../screens/onboarding/LearningGoalsScreen';
import PreferredAreasScreen from '../screens/onboarding/PreferredAreasScreen';
import DifficultiesScreen from '../screens/onboarding/DifficultiesScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

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
      <Stack.Screen 
        name="EnglishLevel" 
        component={EnglishLevelScreen} 
        options={{ title: 'Step 1 of 4' }} 
      />
      <Stack.Screen 
        name="LearningGoals" 
        component={LearningGoalsScreen} 
        options={{ title: 'Step 2 of 4' }} 
      />
      <Stack.Screen 
        name="PreferredAreas" 
        component={PreferredAreasScreen} 
        options={{ title: 'Step 3 of 4' }} 
      />
      <Stack.Screen 
        name="Difficulties" 
        component={DifficultiesScreen} 
        options={{ title: 'Step 4 of 4' }} 
      />
      <Stack.Screen 
        name="OnboardingComplete" 
        component={OnboardingCompleteScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

export default OnboardingStack;
