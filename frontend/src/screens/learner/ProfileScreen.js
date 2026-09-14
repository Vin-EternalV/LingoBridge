import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const SettingRow = ({ icon, title, onPress, danger = false }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress}>
    <View style={styles.settingRowLeft}>
      <Ionicons name={icon} size={22} color={danger ? COLORS.error : COLORS.textSecondary} />
      <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
  </TouchableOpacity>
);

const SettingSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: logout }
      ]
    );
  };

  const handleNotImplemented = (setting) => {
    Alert.alert("Coming Soon", `${setting} settings will be available in a future update.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Profile" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.profileHeader}>
          <Avatar 
            name={`${user?.firstName || 'User'} ${user?.lastName || ''}`} 
            size={80} 
          />
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          <View style={styles.badgeContainer}>
            <Badge text="Intermediate" variant="info" />
          </View>
        </View>

        <SettingSection title="Learning">
          <SettingRow 
            icon="school-outline" 
            title="Learning Profile" 
            onPress={() => handleNotImplemented('Learning Profile')} 
          />
          <SettingRow 
            icon="bar-chart-outline" 
            title="Goals & Progress" 
            onPress={() => handleNotImplemented('Goals & Progress')} 
          />
        </SettingSection>

        <SettingSection title="Preferences">
          <SettingRow 
            icon="person-outline" 
            title="Account Settings" 
            onPress={() => handleNotImplemented('Account Settings')} 
          />
          <SettingRow 
            icon="notifications-outline" 
            title="Notifications" 
            onPress={() => handleNotImplemented('Notifications')} 
          />
          <SettingRow 
            icon="color-palette-outline" 
            title="Appearance" 
            onPress={() => handleNotImplemented('Appearance')} 
          />
        </SettingSection>

        <SettingSection title="Support">
          <SettingRow 
            icon="help-circle-outline" 
            title="Help & Support" 
            onPress={() => handleNotImplemented('Help & Support')} 
          />
          <SettingRow 
            icon="shield-checkmark-outline" 
            title="Privacy & Security" 
            onPress={() => handleNotImplemented('Privacy & Security')} 
          />
        </SettingSection>

        <View style={styles.logoutContainer}>
          <SettingRow 
            icon="log-out-outline" 
            title="Log Out" 
            onPress={handleLogout} 
            danger 
          />
        </View>
        
        <Text style={styles.versionText}>LingoBridge v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.base,
  },
  userName: {
    ...FONTS.h2,
    color: COLORS.text,
    marginTop: SPACING.base,
  },
  userEmail: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  badgeContainer: {
    marginTop: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: SPACING.sm,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    ...FONTS.regular,
    color: COLORS.text,
    marginLeft: SPACING.base,
  },
  dangerText: {
    color: COLORS.error,
  },
  logoutContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.errorLight,
    marginBottom: SPACING.xl,
  },
  versionText: {
    ...FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
});

export default ProfileScreen;
