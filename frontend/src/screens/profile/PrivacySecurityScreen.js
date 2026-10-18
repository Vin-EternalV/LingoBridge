import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { saveJsonFile } from '../../utils/exportFile';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const formatLastLogin = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

const ActionRow = ({ icon, title, description, onPress, busy, danger, last }) => (
  <TouchableOpacity
    style={[styles.actionRow, !last && styles.actionDivider]}
    onPress={onPress}
    disabled={busy}
    activeOpacity={0.7}
    accessibilityRole="button"
  >
    <Ionicons name={icon} size={22} color={danger ? COLORS.error : COLORS.textSecondary} />
    <View style={styles.actionText}>
      <Text style={[styles.actionTitle, danger && styles.dangerText]}>{title}</Text>
      <Text style={styles.actionDesc}>{description}</Text>
    </View>
    {busy ? (
      <ActivityIndicator size="small" color={COLORS.primary} />
    ) : (
      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
    )}
  </TouchableOpacity>
);

const PrivacySecurityScreen = () => {
  const navigation = useNavigation();
  const { user, refreshUser, updateToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saveAiHistory, setSaveAiHistory] = useState(true);
  const [lastLogin, setLastLogin] = useState(user?.lastLogin || null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(null); // which action is running

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await refreshUser();
        if (!active) return;
        setSaveAiHistory(data.user?.settings?.privacy?.saveAiHistory !== false);
        setLastLogin(data.user?.lastLogin || null);
      } catch (err) {
        if (active) setStatus({ type: 'error', message: getErrorMessage(err) });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Saves straight away, like a system settings switch. Rolls back if the server refuses.
  const handleToggleAiHistory = async (value) => {
    setStatus(null);
    setSaveAiHistory(value);
    try {
      await usersApi.updatePrivacy({ saveAiHistory: value });
      await refreshUser();
      setStatus({
        type: 'success',
        message: value
          ? 'New AI conversations will be saved.'
          : 'New AI conversations will not be saved. Existing ones are kept until you clear them.',
      });
    } catch (err) {
      setSaveAiHistory(!value);
      setStatus({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const handleLogoutAll = async () => {
    setStatus(null);
    const confirmed = await confirmAction(
      'Sign out of other devices',
      'Every other phone, tablet or browser signed in to your account will be signed out. This device stays signed in.',
      { confirmText: 'Sign out others' }
    );
    if (!confirmed) return;

    setBusy('logout');
    try {
      const result = await usersApi.logoutAllDevices();
      await updateToken(result?.token);
      setStatus({ type: 'success', message: 'All other devices have been signed out.' });
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async () => {
    setStatus(null);
    setBusy('export');
    try {
      const data = await usersApi.exportMyData();
      const date = new Date().toISOString().slice(0, 10);
      const outcome = await saveJsonFile(`lingobridge-data-${date}.json`, data);
      if (outcome !== 'dismissed') {
        setStatus({
          type: 'success',
          message: outcome === 'downloaded' ? 'Your data was downloaded as a JSON file.' : 'Your data is ready to save or share.',
        });
      }
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err, 'Could not export your data.') });
    } finally {
      setBusy(null);
    }
  };

  const handleClearAi = async () => {
    setStatus(null);
    const confirmed = await confirmAction(
      'Clear AI conversation history',
      'The text of your past AI conversations will be permanently deleted. This cannot be undone.',
      { confirmText: 'Clear', destructive: true }
    );
    if (!confirmed) return;

    setBusy('ai');
    try {
      await usersApi.clearAiHistory();
      setStatus({ type: 'success', message: 'Your AI conversation history has been cleared.' });
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  const handleClearPractice = async () => {
    setStatus(null);
    const confirmed = await confirmAction(
      'Delete practice history',
      'Your saved practice sessions (questions and answers) will be permanently deleted. Your streak and overall progress totals are kept. This cannot be undone.',
      { confirmText: 'Delete', destructive: true }
    );
    if (!confirmed) return;

    setBusy('practice');
    try {
      await usersApi.clearPracticeHistory();
      setStatus({ type: 'success', message: 'Your practice history has been deleted.' });
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <Screen title="Privacy & Security">
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen title="Privacy & Security">
      <StatusMessage type={status?.type} message={status?.message} />

      <SectionLabel>Security</SectionLabel>
      <Card style={styles.listCard}>
        <ActionRow
          icon="key-outline"
          title="Change password"
          description="Changing it also signs out your other devices."
          onPress={() => navigation.navigate('AccountSettings')}
        />
        <ActionRow
          icon="phone-portrait-outline"
          title="Sign out of other devices"
          description="Ends every session except this one."
          onPress={handleLogoutAll}
          busy={busy === 'logout'}
        />
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={22} color={COLORS.textSecondary} />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Last sign-in</Text>
            <Text style={styles.actionDesc}>{formatLastLogin(lastLogin)}</Text>
          </View>
        </View>
      </Card>

      <SectionLabel>Privacy</SectionLabel>
      <Card>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.actionTitle}>Save my AI conversations</Text>
            <Text style={styles.actionDesc}>
              When off, we still count your AI requests but do not store what you and the AI wrote.
            </Text>
          </View>
          <Switch
            value={saveAiHistory}
            onValueChange={handleToggleAiHistory}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.onPrimary}
          />
        </View>
      </Card>

      <SectionLabel hint="You are in control of the information we keep about you.">Your data</SectionLabel>
      <Card style={styles.listCard}>
        <ActionRow
          icon="download-outline"
          title="Download my data"
          description="Get a JSON file of your account, progress, practice and AI history."
          onPress={handleExport}
          busy={busy === 'export'}
        />
        <ActionRow
          icon="chatbubbles-outline"
          title="Clear AI conversation history"
          description="Deletes the text of past AI conversations."
          onPress={handleClearAi}
          busy={busy === 'ai'}
          danger
        />
        <ActionRow
          icon="trash-outline"
          title="Delete practice history"
          description="Removes saved sessions. Streak and totals are kept."
          onPress={handleClearPractice}
          busy={busy === 'practice'}
          danger
          last
        />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: SPACING.xxxl },
  listCard: { padding: 0, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base },
  actionDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionText: { flex: 1, marginLeft: SPACING.base },
  actionTitle: { ...FONTS.regular, fontWeight: '600' },
  actionDesc: { ...FONTS.small, marginTop: 2 },
  dangerText: { color: COLORS.error },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchText: { flex: 1, paddingRight: SPACING.md },
});

export default PrivacySecurityScreen;
