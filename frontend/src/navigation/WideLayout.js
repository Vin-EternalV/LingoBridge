// Desktop / wide-web layout pieces shared by the learner, admin and superadmin apps:
// a left sidebar (used as the tab bar) and a top bar (used as the header).
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { confirmAction } from '../utils/dialog';
import { loadAppearancePrefs, saveAppearancePrefs, effectiveScheme, reloadApp } from '../utils/appearance';
import * as supportApi from '../api/support';
import * as adminApi from '../api/admin';
import { onNotificationsChanged, timeAgo } from '../utils/notifications';
import AppearanceModal from '../components/AppearanceModal';
import ProfilePhotoModal from '../components/ProfilePhotoModal';
import Avatar from '../components/Avatar';
import { removeBackgroundImage } from '../utils/backgroundImage';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

export const SIDEBAR_WIDTH = 220;
export const SIDEBAR_COMPACT_WIDTH = 64;
// Below this window width the sidebar shrinks to an icon-only rail so it never needs a wide window.
export const COMPACT_BREAKPOINT = 700;
// Below this window width (every phone in portrait) the menu moves from the left side to the bottom.
export const BOTTOM_BREAKPOINT = 600;

// Top bar everywhere. The menu is a left sidebar on wide screens (icon-only when a bit narrower)
// and a bottom tab bar on phones.
export const useShell = () => {
  const { width } = useWindowDimensions();
  const enabled = true;
  const bottom = width < BOTTOM_BREAKPOINT;
  const compact = !bottom && width < COMPACT_BREAKPOINT;
  // On phones the menu sits at the bottom, so the content needs no left margin.
  const sidebarWidth = bottom ? 0 : compact ? SIDEBAR_COMPACT_WIDTH : SIDEBAR_WIDTH;
  return { enabled, compact, bottom, sidebarWidth };
};

// Shown under the email in the account menu.
const ROLE_LABELS = { learner: 'Learner', admin: 'Admin', superadmin: 'Super Admin' };

export const useIsWide = () => useShell().enabled;

// [active icon, inactive icon] per route name.
export const LEARNER_ICONS = {
  Home: ['home', 'home-outline'],
  PracticeTab: ['book', 'book-outline'],
  'AI Assistant': ['chatbubble-ellipses', 'chatbubble-ellipses-outline'],
  ProgressTab: ['bar-chart', 'bar-chart-outline'],
  ProfileTab: ['person', 'person-outline'],
};

export const ADMIN_ICONS = {
  Dashboard: ['grid', 'grid-outline'],
  Users: ['people', 'people-outline'],
  Content: ['book', 'book-outline'],
  'AI Activity': ['sparkles', 'sparkles-outline'],
  Reports: ['stats-chart', 'stats-chart-outline'],
  Support: ['headset', 'headset-outline'],
};

export const SUPERADMIN_ICONS = {
  Dashboard: ['shield-checkmark', 'shield-outline'],
  Admins: ['people-circle', 'people-circle-outline'],
  Roles: ['key', 'key-outline'],
  Analytics: ['trending-up', 'trending-up-outline'],
  'AI Activity': ['sparkles', 'sparkles-outline'],
  Reports: ['stats-chart', 'stats-chart-outline'],
  System: ['hardware-chip', 'hardware-chip-outline'],
  'Audit Logs': ['document-text', 'document-text-outline'],
  Support: ['headset', 'headset-outline'],
};

// Pass as <Tab.Navigator tabBar={(props) => <Sidebar {...props} icons={ADMIN_ICONS} caption="Admin" />}>
// hidden: route names that stay navigable but are not listed in the sidebar (e.g. ['ProfileTab']).
export const Sidebar = ({ state, descriptors, navigation, icons = LEARNER_ICONS, caption, hidden = [] }) => {
  const { compact, bottom, sidebarWidth } = useShell();
  const insets = useSafeAreaInsets();

  const items = state.routes.map((route, index) => {
    if (hidden.includes(route.name)) return null;
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label = options.title || route.name;
    const [activeIcon, inactiveIcon] = icons[route.name] || ['ellipse', 'ellipse-outline'];

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const iconColor = focused ? COLORS.primary : COLORS.textSecondary;
    const iconName = focused ? activeIcon : inactiveIcon;

    // Phone: icon with a small label underneath, along the bottom.
    if (bottom) {
      return (
        <TouchableOpacity
          key={route.key}
          style={[styles.bottomItem, focused && styles.bottomItemActive]}
          onPress={onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: focused }}
          accessibilityLabel={label}
        >
          <Ionicons name={iconName} size={22} color={iconColor} />
          <Text style={[styles.bottomLabel, focused && styles.itemTextActive]} numberOfLines={1}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={route.key}
        style={[styles.item, compact && styles.itemCompact, focused && styles.itemActive]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
      >
        <Ionicons name={iconName} size={20} color={iconColor} />
        {!compact && <Text style={[styles.itemText, focused && styles.itemTextActive]}>{label}</Text>}
      </TouchableOpacity>
    );
  });

  if (bottom) {
    // Scrolls sideways if a role has more tabs than fit (admin / superadmin), otherwise the tabs share the width.
    return (
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.xs) }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomBarContent}
        >
          {items}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.sidebar,
        { width: sidebarWidth, paddingTop: SPACING.base + insets.top },
        compact && styles.sidebarCompact,
      ]}
    >
      <View style={[styles.brand, compact && styles.brandCompact]}>
        <Ionicons name="book" size={22} color={COLORS.primary} />
        {!compact && <Text style={styles.brandText}>LingoBridge AI</Text>}
      </View>
      {caption && !compact ? <Text style={styles.caption}>{caption}</Text> : <View style={styles.captionSpacer} />}
      {items}
    </View>
  );
};

// Pass as screenOptions={{ headerShown: true, header: (props) => <TopBar {...props} /> }}
// Bell: new support activity (learners: replies to their requests; admin / superadmin: requests waiting for an answer).
// Avatar menu: learners get Profile and Log Out; admin / superadmin get Profile photo, Background and Log Out.
export const TopBar = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { sidebarWidth, bottom } = useShell();
  const insets = useSafeAreaInsets();
  const [scheme, setScheme] = useState('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notif, setNotif] = useState({ count: 0, items: [] });
  const [photoOpen, setPhotoOpen] = useState(false);

  const isStaff = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    loadAppearancePrefs().then((prefs) => setScheme(effectiveScheme(prefs)));
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await (isStaff ? adminApi.getSupportNotifications() : supportApi.getNotifications());
      setNotif({ count: data?.count || 0, items: data?.items || [] });
    } catch (e) {
      // The bell is a convenience; try again at the next check.
    }
  }, [isStaff]);

  // Check when the bar appears, every 30 seconds, and whenever a screen reports a change.
  useEffect(() => {
    if (!user) return undefined;
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    const unsubscribe = onNotificationsChanged(loadNotifications);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [user?.role, loadNotifications]);

  const notificationTitle = (item) => {
    if (!isStaff) return `Support replied to “${item.subject}”`;
    return item.kind === 'new_request' ? `New request from ${item.name}` : `${item.name} replied`;
  };

  const openNotification = async (item) => {
    setNotifOpen(false);
    setNotif((current) => ({
      count: Math.max(0, current.count - 1),
      items: current.items.filter((entry) => String(entry.ticketId) !== String(item.ticketId)),
    }));
    try {
      if (isStaff) await adminApi.markSupportNotificationSeen(item.ticketId);
      else await supportApi.markTicketSeen(item.ticketId);
    } catch (e) {
      // Continue to the request even if marking it read fails.
    }
    await loadNotifications();
    navigation.navigate(isStaff ? 'Support' : 'HelpSupport');
  };

  const initial = (user?.firstName || user?.email || '?').charAt(0).toUpperCase();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  // Styles are built once at load time, so (like the Appearance screen) a theme change reloads the app.
  const toggleTheme = async () => {
    const prefs = await loadAppearancePrefs();
    // The quick toggle also clears any custom background color or picture so it always switches Light <-> Dark.
    await removeBackgroundImage();
    await saveAppearancePrefs({
      ...prefs,
      theme: scheme === 'dark' ? 'light' : 'dark',
      backgroundColor: null,
      backgroundImage: null,
    });
    reloadApp();
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    const confirmed = await confirmAction('Log Out', 'Are you sure you want to log out?', {
      confirmText: 'Log Out',
      destructive: true,
    });
    if (confirmed) logout();
  };

  const handleAvatar = () => {
    setNotifOpen(false);
    setMenuOpen((open) => !open);
  };

  return (
    <View
      style={[
        styles.topBar,
        { height: 56 + insets.top, paddingTop: insets.top, paddingLeft: sidebarWidth + SPACING.base, paddingRight: bottom ? SPACING.base : SPACING.lg },
      ]}
    >
      {bottom && (
        <View style={styles.topBrand}>
          <Ionicons name="book" size={22} color={COLORS.primary} />
          <Text style={styles.topBrandText}>LingoBridge</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.iconButton}
        onPress={toggleTheme}
        accessibilityRole="button"
        accessibilityLabel="Toggle light or dark theme"
      >
        <Ionicons
          name={scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => {
          setMenuOpen(false);
          setNotifOpen((open) => !open);
          loadNotifications();
        }}
        accessibilityRole="button"
        accessibilityLabel={notif.count > 0 ? `Notifications, ${notif.count} new` : 'Notifications'}
      >
        <Ionicons
          name={notif.count > 0 ? 'notifications' : 'notifications-outline'}
          size={20}
          color={notif.count > 0 ? COLORS.primary : COLORS.textSecondary}
        />
        {notif.count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notif.count > 9 ? '9+' : notif.count}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.avatarButton}
        onPress={handleAvatar}
        accessibilityRole="button"
        accessibilityLabel="Open account menu"
      >
        <Avatar name={fullName || user?.email} imageUrl={user?.avatar} size={32} />
        <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {notifOpen && (
        <View style={styles.notifPanel}>
          <Text style={styles.notifTitle}>Notifications</Text>
          {notif.items.length === 0 ? (
            <Text style={styles.notifEmpty}>You're all caught up.</Text>
          ) : (
            notif.items.map((item) => (
              <TouchableOpacity
                key={`${item.ticketId}-${item.at}`}
                style={styles.notifItem}
                onPress={() => openNotification(item)}
                accessibilityRole="button"
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} />
                <View style={styles.notifBody}>
                  <Text style={styles.notifText} numberOfLines={2}>
                    {notificationTitle(item)}
                  </Text>
                  <Text style={styles.notifSub} numberOfLines={1}>
                    {item.preview || item.subject}
                  </Text>
                  <Text style={styles.notifTime}>{timeAgo(item.at)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          {!isStaff && (
            <TouchableOpacity
              style={styles.notifFooter}
              onPress={() => {
                setNotifOpen(false);
                navigation.navigate('Notifications');
              }}
              accessibilityRole="button"
            >
              <Text style={styles.notifFooterText}>Notification settings</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {menuOpen && (
        <View style={styles.menu}>
          <View style={styles.menuInfo}>
            {!!fullName && <Text style={styles.menuName} numberOfLines={1}>{fullName}</Text>}
            <Text style={styles.menuEmail} numberOfLines={1}>{user?.email}</Text>
            <Text style={styles.menuRole}>{ROLE_LABELS[user?.role] || 'Learner'}</Text>
          </View>
          {isStaff ? (
            <>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              setPhotoOpen(true);
            }}
            accessibilityRole="button"
          >
            <Ionicons name="camera-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.menuItemTextNeutral}>Profile photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              setAppearanceOpen(true);
            }}
            accessibilityRole="button"
          >
            <Ionicons name="color-palette-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.menuItemTextNeutral}>Background</Text>
          </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('ProfileTab');
              }}
              accessibilityRole="button"
            >
              <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.menuItemTextNeutral}>Profile</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            <Text style={styles.menuItemText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      <AppearanceModal visible={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
      <ProfilePhotoModal visible={photoOpen} onClose={() => setPhotoOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.base,
    zIndex: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    height: 40,
    paddingHorizontal: SPACING.sm,
  },
  brandText: { ...FONTS.h4, color: COLORS.text },
  sidebarCompact: { paddingHorizontal: SPACING.sm },
  brandCompact: { justifyContent: 'center', paddingHorizontal: 0 },
  itemCompact: { justifyContent: 'center', paddingHorizontal: 0 },
  caption: {
    ...FONTS.tiny,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  captionSpacer: { height: SPACING.lg },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  itemActive: { backgroundColor: COLORS.primaryLight },
  itemText: { ...FONTS.small, color: COLORS.textSecondary },
  itemTextActive: { color: COLORS.primary, fontWeight: '600' },
  bottomBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  bottomBarContent: { flexGrow: 1 },
  bottomItem: {
    flex: 1,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.lg,
  },
  bottomItemActive: { backgroundColor: COLORS.primaryLight },
  bottomLabel: { ...FONTS.tiny, fontSize: 11, color: COLORS.textSecondary },
  topBrand: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginRight: 'auto' },
  topBrandText: { ...FONTS.h4, color: COLORS.text },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    height: 56,
    paddingRight: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  iconButton: { padding: SPACING.sm, borderRadius: RADIUS.full },
  avatarButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  notifPanel: {
    position: 'absolute',
    top: '100%',
    right: SPACING.base,
    width: 280,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.xs,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 30,
  },
  notifTitle: { ...FONTS.small, color: COLORS.text, fontWeight: '700', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  notifEmpty: { ...FONTS.small, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notifBody: { flex: 1 },
  notifText: { ...FONTS.small, color: COLORS.text, fontWeight: '600' },
  notifSub: { ...FONTS.tiny },
  notifTime: { ...FONTS.tiny, color: COLORS.primary, marginTop: 2 },
  notifFooter: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  notifFooterText: { ...FONTS.small, color: COLORS.primary, fontWeight: '600' },
  menu: {
    position: 'absolute',
    top: '100%',
    right: SPACING.base,
    width: 220,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.xs,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 30,
  },
  menuInfo: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuName: { ...FONTS.small, color: COLORS.text, fontWeight: '600' },
  menuEmail: { ...FONTS.tiny },
  menuRole: { ...FONTS.tiny, color: COLORS.primary, marginTop: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  menuItemText: { ...FONTS.small, color: COLORS.error, fontWeight: '600' },
  menuItemTextNeutral: { ...FONTS.small, color: COLORS.text, fontWeight: '600' },
});
