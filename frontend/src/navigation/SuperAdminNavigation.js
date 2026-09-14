import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDashboardScreen from '../screens/superadmin/SuperAdminDashboardScreen';
import AdminManagementScreen from '../screens/superadmin/AdminManagementScreen';
import RolesPermissionsScreen from '../screens/superadmin/RolesPermissionsScreen';
import PlatformAnalyticsScreen from '../screens/superadmin/PlatformAnalyticsScreen';
import SystemMonitoringScreen from '../screens/superadmin/SystemMonitoringScreen';
import AuditLogsScreen from '../screens/superadmin/AuditLogsScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

const SuperAdminNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'shield-outline';
          if (route.name === 'Dashboard') iconName = focused ? 'shield-checkmark' : 'shield-outline';
          else if (route.name === 'Admins') iconName = focused ? 'people-circle' : 'people-circle-outline';
          else if (route.name === 'Roles') iconName = focused ? 'key' : 'key-outline';
          else if (route.name === 'Analytics') iconName = focused ? 'trending-up' : 'trending-up-outline';
          else if (route.name === 'System') iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
          else if (route.name === 'Audit Logs') iconName = focused ? 'document-text' : 'document-text-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={SuperAdminDashboardScreen} />
      <Tab.Screen name="Admins" component={AdminManagementScreen} />
      <Tab.Screen name="Roles" component={RolesPermissionsScreen} />
      <Tab.Screen name="Analytics" component={PlatformAnalyticsScreen} />
      <Tab.Screen name="System" component={SystemMonitoringScreen} />
      <Tab.Screen name="Audit Logs" component={AuditLogsScreen} />
    </Tab.Navigator>
  );
};

export default SuperAdminNavigation;
