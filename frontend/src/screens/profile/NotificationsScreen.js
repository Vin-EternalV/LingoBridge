import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../utils/errors';
import {
  remindersSupported,
  remindersUnavailableMessage,
  requestReminderPermission,
  applyReminders,
} from '../../utils/notifications';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import StatusMessage from '../../components/StatusMessage';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const TIMES = ['07:00', '09:00', '12:00', '15:00', '18:00', '20:00', '21:00'];

const formatTime = (value) => {
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

const NotificationsScreen = () => {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [saved, setSaved] = useState(null);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('18:00');
  const [weeklyReminder, setWeeklyReminder] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await refreshUser();
        const n = data.user?.settings?.notifications || {};
        const values = {
          dailyReminder: n.dailyReminder ?? true,
          reminderTime: n.reminderTime || '18:00',
          weeklyReminder: n.weeklyReminder ?? true,
        };
        if (active) {
          setSaved(values);
          setDailyReminder(values.dailyReminder);
          setReminderTime(values.reminderTime);
          setWeeklyReminder(values.weeklyReminder);
        }
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

  const dirty =
    !!saved &&
    (dailyReminder !== saved.dailyReminder ||
      weeklyReminder !== saved.weeklyReminder ||
      (dailyReminder && reminderTime !== saved.reminderTime));

  // Turning a reminder ON on a phone needs the OS notification permission first.
  const handleToggle = async (setter, value) => {
    setStatus(null);
    if (value && remindersSupported) {
      try {
        const granted = await requestReminderPermission();
        if (!granted) {
          setStatus({
            type: 'error',
            message: 'Notifications are blocked for LingoBridge. Allow them in your device settings to get reminders.',
          });
          return;
        }
      } catch (err) {
        setStatus({ type: 'error', message: 'Could not ask for notification permission on this device.' });
        return;
      }
    }
    setter(value);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    const notifications = { dailyReminder, reminderTime, weeklyReminder };
    try {
      await usersApi.updateSettings({ notifications });
      setSaved(notifications);
      await refreshUser();
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
      setSaving(false);
      return;
    }

    if (remindersSupported) {
      try {
        await applyReminders(notifications);
        setStatus({ type: 'success', message: 'Saved. Your reminders are scheduled on this device.' });
      } catch (err) {
        setStatus({ type: 'error', message: 'Saved, but reminders could not be scheduled on this device.' });
      }
    } else {
      setStatus({ type: 'success', message: 'Preferences saved. Reminders are not available in this environment.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Screen title="Notifications">
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen title="Notifications">
      {!remindersSupported && (
        <View style={styles.infoBox}>
          <Ionicons name="phone-portrait-outline" size={20} color={COLORS.primaryDark} />
          <Text style={styles.infoText}>{remindersUnavailableMessage}</Text>
        </View>
      )}

      <StatusMessage type={status?.type} message={status?.message} />

      <Card>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Daily practice reminder</Text>
            <Text style={styles.rowDesc}>A nudge at the same time every day.</Text>
          </View>
          <Switch
            value={dailyReminder}
            onValueChange={(value) => handleToggle(setDailyReminder, value)}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.onPrimary}
          />
        </View>

        {dailyReminder && (
          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>Remind me at</Text>
            <View style={styles.chipWrap}>
              {TIMES.map((time) => (
                <Chip
                  key={time}
                  label={formatTime(time)}
                  selected={reminderTime === time}
                  onPress={() => {
                    setStatus(null);
                    setReminderTime(time);
                  }}
                />
              ))}
            </View>
          </View>
        )}
      </Card>

      <Card>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Weekly progress check-in</Text>
            <Text style={styles.rowDesc}>A reminder every Sunday morning to review your week.</Text>
          </View>
          <Switch
            value={weeklyReminder}
            onValueChange={(value) => handleToggle(setWeeklyReminder, value)}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.onPrimary}
          />
        </View>
      </Card>

      <Button title="Save preferences" onPress={handleSave} loading={saving} disabled={!dirty} fullWidth />
    </Screen>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: SPACING.xxxl },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  infoText: { ...FONTS.small, color: COLORS.primaryDark, flex: 1, marginLeft: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { flex: 1, paddingRight: SPACING.md },
  rowTitle: { ...FONTS.regular, fontWeight: '600' },
  rowDesc: { ...FONTS.small, marginTop: 2 },
  timeSection: { marginTop: SPACING.base, paddingTop: SPACING.base, borderTopWidth: 1, borderTopColor: COLORS.border },
  timeLabel: { ...FONTS.small, fontWeight: '600', marginBottom: SPACING.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});

export default NotificationsScreen;
