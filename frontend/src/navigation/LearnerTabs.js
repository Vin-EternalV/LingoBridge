import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/learner/DashboardScreen';
import PracticeScreen from '../screens/learner/PracticeScreen';
import AIAssistantScreen from '../screens/learner/AIAssistantScreen';
import ProgressScreen from '../screens/learner/ProgressScreen';
import ProfileScreen from '../screens/learner/ProfileScreen';
import { Sidebar, TopBar, useShell } from './WideLayout';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

const LearnerTabs = () => {
  // Sidebar + top bar on web (icon-only when narrow); bottom tabs on native phone builds.
  const { enabled, sidebarWidth } = useShell();
  const navigation = useNavigation();
  const { user } = useAuth();
  const guideOpened = useRef(false);

  useEffect(() => {
    if (guideOpened.current || !user || user.role !== 'learner' || user.guideSeenAt) return undefined;
    const ageDays = (Date.now() - new Date(user.createdAt).getTime()) / 86400000;
    if (!(ageDays <= 14)) return undefined;
    guideOpened.current = true;
    const timer = setTimeout(() => navigation.navigate('AppGuide', { firstRun: true }), 600);
    return () => clearTimeout(timer);
  }, [user, navigation]);

  return (
    <Tab.Navigator
      {...(enabled
        ? {
            // Profile lives in the avatar menu at the top, so it is not listed in the sidebar.
            tabBar: (props) => <Sidebar {...props} hidden={['ProfileTab']} />,
            sceneContainerStyle: { marginLeft: sidebarWidth },
          }
        : {})}
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
        headerShown: enabled,
        header: (props) => <TopBar {...props} />,
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
