import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import Header from "../../components/Header";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import VerticalBarChart from "../../components/VerticalBarChart";
import PieChart from "../../components/PieChart";
import * as superAdminApi from "../../api/superadmin";
import { getErrorMessage } from "../../utils/errors";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const PERIODS = [7, 30, 90];
const fillDailyTrend = (rows = [], days) => {
  const values = new Map(rows.map((row) => [row._id, row.count]));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const bucketSize = days === 7 ? 1 : 7;
  const buckets = [];
  for (let offset = 0; offset < days; offset += bucketSize) {
    const width = Math.min(bucketSize, days - offset);
    let value = 0;
    for (let day = 0; day < width; day += 1) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + offset + day);
      value += values.get(date.toISOString().slice(0, 10)) || 0;
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + offset + width - 1);
    buckets.push({ label: end.toISOString().slice(5, 10), value });
  }
  return buckets;
};

const PlatformAnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async (period = days) => {
    try {
      setError("");
      const data = await superAdminApi.getAnalytics({ days: period });
      setAnalytics(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load platform analytics."));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchAnalytics(days); }, [days]);

  if (loading) return <LoadingSpinner fullScreen message="Loading Platform Analytics..." />;

  const total = analytics?.totalUsers ?? 0;
  const weekly = analytics?.activeUsersWeekly ?? 0;
  const completed = analytics?.completedSessions ?? 0;
  const accuracy = analytics?.averageAccuracy ?? 0;
  const selectedDays = analytics?.days || days;
  const roleRows = Object.entries(analytics?.roleCounts || {}).map(([role, count]) => ({ label: role[0].toUpperCase() + role.slice(1), value: count }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Platform Analytics" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Growth & Engagement Insights</Text>
        {error ? <ErrorMessage message={error} onRetry={() => fetchAnalytics(days)} /> : (
          <>
            <View style={styles.grid}>
              <View style={styles.col}><StatCard icon="people" label="Total Users" value={total} color={COLORS.primary} /></View>
              <View style={styles.col}><StatCard icon="pulse" label="Weekly Active" value={weekly} color={COLORS.success} /></View>
              <View style={styles.col}><StatCard icon="checkmark-done" label="Completed Sessions" value={completed} color="#8B5CF6" /></View>
              <View style={styles.col}><StatCard icon="stats-chart" label="Avg Accuracy" value={`${accuracy}%`} color="#F59E0B" /></View>
            </View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Reporting period</Text>
              <View style={styles.periods}>
                {PERIODS.map((period) => (
                  <TouchableOpacity key={period} accessibilityRole="button" accessibilityState={{ selected: days === period }} onPress={() => setDays(period)} style={[styles.periodButton, days === period && styles.periodSelected]}>
                    <Text style={[styles.periodText, days === period && styles.periodTextSelected]}>Last {period} days</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.caption}>Trends use UTC calendar days. Weekly active users covers the last 7 days.</Text>
            </Card>
            <Card style={styles.card}>
              <VerticalBarChart title={`Practice sessions · last ${selectedDays} days`} data={fillDailyTrend(analytics?.sessionTrend, selectedDays)} color="#8B5CF6" />
            </Card>
            <Card style={styles.card}>
              <VerticalBarChart title={`New accounts · last ${selectedDays} days`} data={fillDailyTrend(analytics?.userTrend, selectedDays)} color={COLORS.success} />
            </Card>
            <Card style={styles.card}>
              <PieChart title="Users by role" data={roleRows} emptyMessage="No users recorded." />
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.base },
  pageTitle: { ...FONTS.h2, marginBottom: SPACING.base },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: SPACING.base },
  col: { width: "48%", marginBottom: SPACING.base },
  card: { padding: SPACING.base },
  cardTitle: { ...FONTS.h3, marginBottom: SPACING.md },
  periods: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  periodButton: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  periodSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { ...FONTS.small },
  periodTextSelected: { color: COLORS.onPrimary, fontWeight: '600' },
  caption: { ...FONTS.tiny, marginTop: SPACING.md },
});

export default PlatformAnalyticsScreen;
