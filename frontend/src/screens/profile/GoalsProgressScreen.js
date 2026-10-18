import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../utils/errors';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdayOf = (dateKey) => WEEKDAYS[new Date(`${dateKey}T00:00:00Z`).getUTCDay()];

const Stepper = ({ label, value, unit, min, max, step, onChange }) => (
  <View style={styles.stepper}>
    <View style={styles.stepperInfo}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <Text style={styles.stepperValue}>
        {value} <Text style={styles.stepperUnit}>{unit}</Text>
      </Text>
    </View>
    <View style={styles.stepperButtons}>
      <TouchableOpacity
        style={[styles.stepButton, value <= min && styles.stepDisabled]}
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        accessibilityLabel={`Decrease ${label}`}
      >
        <Ionicons name="remove" size={22} color={COLORS.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.stepButton, value >= max && styles.stepDisabled]}
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        accessibilityLabel={`Increase ${label}`}
      >
        <Ionicons name="add" size={22} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  </View>
);

const GoalsProgressScreen = () => {
  const { refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(15);
  const [weeklyGoal, setWeeklyGoal] = useState(5);

  const load = useCallback(async () => {
    try {
      const result = await usersApi.getGoalsProgress();
      setData(result);
      setDailyGoal(result.dailyGoalMinutes);
      setWeeklyGoal(result.weeklyGoalSessions);
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the screen is shown, so new practice sessions appear straight away.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const dirty = !!data && (dailyGoal !== data.dailyGoalMinutes || weeklyGoal !== data.weeklyGoalSessions);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await usersApi.updateGoals({ dailyGoalMinutes: dailyGoal, weeklyGoalSessions: weeklyGoal });
      setData((prev) => ({ ...prev, dailyGoalMinutes: dailyGoal, weeklyGoalSessions: weeklyGoal }));
      await refreshUser();
      setStatus({ type: 'success', message: 'Goals saved.' });
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen title="Goals & Progress">
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen title="Goals & Progress">
        <StatusMessage type="error" message={status?.message || 'Could not load your progress.'} />
        <Button title="Try again" onPress={load} variant="outline" fullWidth />
      </Screen>
    );
  }

  const dailyRatio = data.dailyGoalMinutes ? data.todayMinutes / data.dailyGoalMinutes : 0;
  const weeklyRatio = data.weeklyGoalSessions ? data.weekSessions / data.weeklyGoalSessions : 0;
  const chartMax = Math.max(data.dailyGoalMinutes, ...data.days.map((day) => day.minutes), 1);

  return (
    <Screen title="Goals & Progress">
      <StatusMessage type={status?.type} message={status?.message} />

      <View style={styles.streakRow}>
        <Card style={styles.streakCard}>
          <Ionicons name="flame" size={26} color={COLORS.warning} />
          <Text style={styles.streakValue}>{data.streak.current}</Text>
          <Text style={styles.streakLabel}>Day streak</Text>
        </Card>
        <Card style={styles.streakCard}>
          <Ionicons name="trophy" size={26} color={COLORS.primary} />
          <Text style={styles.streakValue}>{data.streak.longest}</Text>
          <Text style={styles.streakLabel}>Longest streak</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Today</Text>
        <ProgressBar
          progress={dailyRatio}
          color={dailyRatio >= 1 ? COLORS.success : COLORS.primary}
          height={10}
        />
        <Text style={styles.cardCaption}>
          {data.todayMinutes} of {data.dailyGoalMinutes} min
          {dailyRatio >= 1 ? '  •  Goal reached!' : ''}
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Last 7 days</Text>
        <ProgressBar
          progress={weeklyRatio}
          color={weeklyRatio >= 1 ? COLORS.success : COLORS.primary}
          height={10}
        />
        <Text style={styles.cardCaption}>
          {data.weekSessions} of {data.weeklyGoalSessions} sessions
          {weeklyRatio >= 1 ? '  •  Goal reached!' : ''}
        </Text>

        <View style={styles.chart}>
          {data.days.map((day) => {
            const height = Math.max(4, Math.round((day.minutes / chartMax) * 80));
            const met = day.minutes >= data.dailyGoalMinutes;
            return (
              <View key={day.date} style={styles.chartColumn}>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      { height, backgroundColor: met ? COLORS.success : COLORS.primary },
                      day.minutes === 0 && styles.chartBarEmpty,
                    ]}
                  />
                </View>
                <Text style={styles.chartDay}>{weekdayOf(day.date)}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.chartHint}>Minutes practised per day</Text>
      </Card>

      <SectionLabel hint="Set targets that feel achievable. You can change them any time.">
        Your goals
      </SectionLabel>
      <Card>
        <Stepper
          label="Daily goal"
          value={dailyGoal}
          unit="min / day"
          min={5}
          max={240}
          step={5}
          onChange={(value) => {
            setStatus(null);
            setDailyGoal(value);
          }}
        />
        <View style={styles.divider} />
        <Stepper
          label="Weekly goal"
          value={weeklyGoal}
          unit="sessions / week"
          min={1}
          max={21}
          step={1}
          onChange={(value) => {
            setStatus(null);
            setWeeklyGoal(value);
          }}
        />
      </Card>

      <Button title="Save goals" onPress={handleSave} loading={saving} disabled={!dirty} fullWidth />
    </Screen>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: SPACING.xxxl },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between' },
  streakCard: { width: '48%', alignItems: 'center' },
  streakValue: { ...FONTS.h1, marginTop: SPACING.xs },
  streakLabel: { ...FONTS.small },
  cardTitle: { ...FONTS.h4, marginBottom: SPACING.md },
  cardCaption: { ...FONTS.small, marginTop: SPACING.sm },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  chartColumn: { alignItems: 'center', flex: 1 },
  chartTrack: { height: 80, justifyContent: 'flex-end' },
  chartBar: { width: 16, borderRadius: RADIUS.sm },
  chartBarEmpty: { backgroundColor: COLORS.border },
  chartDay: { ...FONTS.tiny, marginTop: SPACING.xs },
  chartHint: { ...FONTS.tiny, textAlign: 'center', marginTop: SPACING.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperInfo: { flex: 1 },
  stepperLabel: { ...FONTS.small, fontWeight: '600' },
  stepperValue: { ...FONTS.h3, marginTop: 2 },
  stepperUnit: { ...FONTS.small },
  stepperButtons: { flexDirection: 'row' },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  stepDisabled: { opacity: 0.35 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.base },
});

export default GoalsProgressScreen;
