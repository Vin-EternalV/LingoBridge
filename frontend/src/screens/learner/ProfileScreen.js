import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import ProfilePhotoModal from '../../components/ProfilePhotoModal';
import Badge from '../../components/Badge';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { levelLabel } from '../../constants/learningOptions';
import { confirmAction } from '../../utils/dialog';

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
  const { user, logout, refreshUser } = useAuth();
  const [photoOpen, setPhotoOpen] = useState(false);
  const navigation = useNavigation();

  // Keep the name, email and level badge in step with changes made on the sub-screens.
  useFocusEffect(
    useCallback(() => {
      refreshUser().catch(() => {});
    }, [])
  );

  const handleLogout = async () => {
    const confirmed = await confirmAction('Log Out', 'Are you sure you want to log out?', {
      confirmText: 'Log Out',
      destructive: true,
    });
    if (confirmed) logout();
  };

  const level = levelLabel(user?.profile?.englishLevel);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Profile" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={() => setPhotoOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <Avatar
              name={`${user?.firstName || 'User'} ${user?.lastName || ''}`}
              imageUrl={user?.avatar}
              size={80}
            />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={COLORS.onPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {level && (
            <View style={styles.badgeContainer}>
              <Badge text={level} variant="info" />
            </View>
          )}
        </View>

        <SettingSection title="Learning">
          <SettingRow 
            icon="school-outline" 
            title="Learning Profile" 
            onPress={() => navigation.navigate('LearningProfile')} 
          />
          <SettingRow 
            icon="bar-chart-outline" 
            title="Goals & Progress" 
            onPress={() => navigation.navigate('GoalsProgress')} 
          />
        </SettingSection>

        <SettingSection title="Preferences">
          <SettingRow 
            icon="person-outline" 
            title="Account Settings" 
            onPress={() => navigation.navigate('AccountSettings')} 
          />
          <SettingRow 
            icon="notifications-outline" 
            title="Notifications" 
            onPress={() => navigation.navigate('Notifications')} 
          />
          <SettingRow 
            icon="color-palette-outline" 
            title="Appearance" 
            onPress={() => navigation.navigate('Appearance')} 
          />
        </SettingSection>

        <SettingSection title="Support">
          <SettingRow 
            icon="help-circle-outline" 
            title="Help & Support" 
            onPress={() => navigation.navigate('HelpSupport')} 
          />
          <SettingRow 
            icon="shield-checkmark-outline" 
            title="Privacy & Security" 
            onPress={() => navigation.navigate('PrivacySecurity')} 
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
      <ProfilePhotoModal visible={photoOpen} onClose={() => setPhotoOpen(false)} />
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
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
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
