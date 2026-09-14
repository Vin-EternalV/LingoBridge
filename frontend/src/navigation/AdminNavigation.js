import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import LearningContentScreen from '../screens/admin/LearningContentScreen';
import AIActivityScreen from '../screens/admin/AIActivityScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

const AdminNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'grid-outline';
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Users') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Content') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'AI Activity') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Reports') iconName = focused ? 'stats-chart' : 'stats-chart-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Users" component={UserManagementScreen} />
      <Tab.Screen name="Content" component={LearningContentScreen} />
      <Tab.Screen name="AI Activity" component={AIActivityScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
};

export default AdminNavigation;
