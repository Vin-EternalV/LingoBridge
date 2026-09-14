import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/learner/DashboardScreen';
import PracticeScreen from '../screens/learner/PracticeScreen';
import AIAssistantScreen from '../screens/learner/AIAssistantScreen';
import ProgressScreen from '../screens/learner/ProgressScreen';
import ProfileScreen from '../screens/learner/ProfileScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

const LearnerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'PracticeTab') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'AI Assistant') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'ProgressTab') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          borderTopColor: COLORS.border,
          elevation: 8,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="PracticeTab" component={PracticeScreen} options={{ title: 'Practice' }} />
      <Tab.Screen name="AI Assistant" component={AIAssistantScreen} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default LearnerTabs;
