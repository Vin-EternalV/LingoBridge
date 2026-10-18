import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useIsWide } from '../navigation/WideLayout';
import { confirmAction } from '../utils/dialog';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const Header = ({ title, showBack = false, onBack, rightComponent }) => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const isWide = useIsWide();

  // Admin and superadmin screens have no Profile tab, so the header carries their log out button.
  // On wide web the top bar's account menu already has Log Out, so the icon only shows on phones / narrow windows.
  const isStaff = (user?.role === 'admin' || user?.role === 'superadmin') && !isWide;

  const handleLogout = async () => {
    const confirmed = await confirmAction('Log Out', 'Are you sure you want to log out?', {
      confirmText: 'Log Out',
      destructive: true,
    });
    if (confirmed) logout();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      
      <View style={styles.right}>
        {rightComponent ||
          (isStaff && (
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    height: 56,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  center: {
    flex: 2,
    alignItems: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logoutButton: {
    padding: SPACING.xs,
    marginRight: -SPACING.xs,
  },
  backButton: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
  },
});

export default Header;
