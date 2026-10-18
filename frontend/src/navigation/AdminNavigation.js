import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import LearningContentScreen from '../screens/admin/LearningContentScreen';
import AIActivityScreen from '../screens/admin/AIActivityScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import SupportRequestsScreen from '../screens/admin/SupportRequestsScreen';
import { Sidebar, TopBar, useShell, ADMIN_ICONS } from './WideLayout';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

const AdminNavigation = () => {
  const { enabled, sidebarWidth } = useShell();

  return (
    <Tab.Navigator
      {...(enabled
        ? {
            tabBar: (props) => <Sidebar {...props} icons={ADMIN_ICONS} caption="Admin" />,
            sceneContainerStyle: { marginLeft: sidebarWidth },
          }
        : {})}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'grid-outline';
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Users') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Content') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'AI Activity') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Reports') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Support') iconName = focused ? 'headset' : 'headset-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: enabled,
        header: (props) => <TopBar {...props} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Users" component={UserManagementScreen} />
      <Tab.Screen name="Content" component={LearningContentScreen} />
      <Tab.Screen name="AI Activity" component={AIActivityScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Support" component={SupportRequestsScreen} />
    </Tab.Navigator>
  );
};

export default AdminNavigation;
