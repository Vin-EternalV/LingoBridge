import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Header from "../../components/Header";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import PieChart from "../../components/PieChart";
import VerticalBarChart from "../../components/VerticalBarChart";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import * as superAdminApi from "../../api/superadmin";
import * as adminApi from "../../api/admin";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const dailyData = (rows = []) => {
  const values = new Map(rows.map((row) => [row._id, row.count]));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return { label: date.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }), value: values.get(date.toISOString().slice(0, 10)) || 0 };
  });
};

const SuperAdminDashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [aiActivity, setAIActivity] = useState(null);
  const [reports, setReports] = useState(null);
  const [loadErrors, setLoadErrors] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dash, an, ai, reportData] = await Promise.allSettled([
          superAdminApi.getDashboardStats(),
          superAdminApi.getAnalytics(),
          adminApi.getAIActivity(),
          adminApi.getReports(),
        ]);
        if (dash.status === "fulfilled") setStats(dash.value);
        if (an.status === "fulfilled") setAnalytics(an.value);
        if (ai.status === "fulfilled") setAIActivity(ai.value);
        if (reportData.status === "fulfilled") setReports(reportData.value);
        const failures = [
          ["overview", dash],
          ["platform analytics", an],
          ["AI activity", ai],
          ["reports", reportData],
        ].filter(([, result]) => result.status === "rejected");
        setLoadErrors(failures.map(([area, result]) => `${area}: ${result.reason?.response?.data?.message || result.reason?.message || "request failed"}`));
      } catch (err) {
        console.log("Super admin dashboard error:", err);
        setLoadErrors([err?.message || "Could not load dashboard data."]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading)
    return (
      <LoadingSpinner fullScreen message="Loading Super Admin Console..." />
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Super Admin Dashboard" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>System & Governance Overview</Text>
        {loadErrors.length > 0 && (
          <ErrorMessage message={`Some dashboard data could not be loaded: ${loadErrors.join("; ")}`} />
        )}

        <View style={styles.grid}>
          <View style={styles.col}>
            <StatCard
              icon="people"
              label="Total Users"
              value={stats?.totalUsers ?? 0}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.col}>
            <StatCard
              icon="shield-checkmark"
              label="Administrators"
              value={stats?.totalAdmins ?? 0}
              color="#8B5CF6"
            />
          </View>
          <View style={styles.col}>
            <StatCard
              icon="pulse"
              label="Active Learners"
              value={stats?.activeLearners ?? 0}
              color={COLORS.success}
            />
          </View>
          <View style={styles.col}>
            <StatCard
              icon="document-text"
              label="Audit Logs"
              value={stats?.logCount ?? 0}
              color="#F59E0B"
            />
          </View>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Platform Analytics Snapshot</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Weekly active users</Text>
            <Text style={styles.val}>{analytics?.activeUsersWeekly ?? 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Completed sessions</Text>
            <Text style={styles.val}>{analytics?.completedSessions ?? 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Average accuracy</Text>
            <Text style={styles.val}>{analytics?.averageAccuracy ?? 0}%</Text>
          </View>
        </Card>
        <Card style={styles.card}>
          <VerticalBarChart title="Practice sessions · last 7 days" data={dailyData(analytics?.sessionTrend)} color="#8B5CF6" emptyMessage="No practice sessions in this period." />
        </Card>
        <Card style={styles.card}>
          <PieChart title="Users by role" data={Object.entries(analytics?.roleCounts || {}).map(([role, value]) => ({ label: role[0].toUpperCase() + role.slice(1), value }))} emptyMessage="No users recorded." />
        </Card>
        <Card style={styles.card}>
          <PieChart title="AI requests by service" data={(aiActivity?.byType || []).map((item) => ({ label: ({ exercise_generation: 'Exercises', feedback: 'Evaluations', assistant_chat: 'Tutor chats' })[item._id] || item._id, value: item.count }))} emptyMessage="No AI activity recorded yet." />
        </Card>
        <Card style={styles.card}>
          <VerticalBarChart title="Average accuracy by skill (%)" data={(reports?.skillDistribution || []).map((skill) => ({ label: skill._id[0].toUpperCase() + skill._id.slice(1), value: Math.round(skill.averageAccuracy || 0) }))} color={COLORS.success} emptyMessage="No completed practice sessions yet." />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { padding: SPACING.base },
  pageTitle: { ...FONTS.h2, marginBottom: SPACING.base },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: SPACING.base,
  },
  col: { width: "48%", marginBottom: SPACING.base },
  card: { padding: SPACING.base },
  cardTitle: { ...FONTS.h3, marginBottom: SPACING.base },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: { ...FONTS.regular },
  val: { ...FONTS.regular, fontWeight: "bold", color: COLORS.primary },
});

export default SuperAdminDashboardScreen;
