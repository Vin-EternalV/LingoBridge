import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from "react-native";
import Header from "../../components/Header";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import AnalyticsBarChart from "../../components/AnalyticsBarChart";
import VerticalBarChart from "../../components/VerticalBarChart";
import PieChart from "../../components/PieChart";
import LoadingSpinner from "../../components/LoadingSpinner";
import * as adminApi from "../../api/admin";
import { titleCase } from "../../utils/format";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const AdminDashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.log("Admin stats error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading)
    return <LoadingSpinner fullScreen message="Loading Admin Dashboard..." />;

  const totalUsers = stats?.totalUsers ?? 0;
  const activeLearners = stats?.activeLearners ?? 0;
  const totalSessions = stats?.totalPracticeSessions ?? 0;
  const totalAIInteractions = stats?.totalAIInteractions ?? 0;
  const topSkills = stats?.topSkills || [];
  const sessionTrend = (() => {
    const rows = new Map((stats?.sessionTrend || []).map((row) => [row._id, row.count]));
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return { label: date.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }), value: rows.get(key) || 0 };
    });
  })();
  const statusRows = Object.entries(stats?.sessionStatuses || {}).map(([status, count]) => ({
    label: titleCase(status.replace('_', ' ')), value: count,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Admin Overview" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <Text style={styles.pageTitle}>Platform Activity Overview</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <StatCard
              icon="people"
              label="Total Users"
              value={totalUsers}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              icon="pulse"
              label="Active Learners"
              value={activeLearners}
              color={COLORS.success}
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              icon="book"
              label="Practice Sessions"
              value={totalSessions}
              color="#8B5CF6"
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              icon="sparkles"
              label="AI Interactions"
              value={totalAIInteractions}
              color="#F59E0B"
            />
          </View>
        </View>

        <Card style={styles.sectionCard}>
          <VerticalBarChart title="Practice sessions · last 7 days" data={sessionTrend} color="#8B5CF6" />
        </Card>

        <Card style={styles.sectionCard}>
          <PieChart title="Sessions by status" data={statusRows} emptyMessage="No sessions recorded yet." />
        </Card>

        <Card style={styles.sectionCard}>
          <AnalyticsBarChart title="Most practiced skills" data={topSkills.map((s) => ({ label: titleCase(s.skill), value: s.count }))} color={COLORS.primary} emptyMessage="No sessions recorded yet." />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { padding: SPACING.base },
  pageTitle: { ...FONTS.h2, marginBottom: SPACING.base },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: SPACING.base,
  },
  statCol: { width: "48%", marginBottom: SPACING.base },
  sectionCard: { padding: SPACING.base, marginBottom: SPACING.base },
});

export default AdminDashboardScreen;
