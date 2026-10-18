import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Header from "../../components/Header";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import VerticalBarChart from "../../components/VerticalBarChart";
import PieChart from "../../components/PieChart";
import LoadingSpinner from "../../components/LoadingSpinner";
import * as adminApi from "../../api/admin";
import { titleCase } from "../../utils/format";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const ReportsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try { setReports(await adminApi.getReports()); }
      catch (err) { console.log("Reports fetch error:", err); }
      finally { setLoading(false); }
    };
    fetchReports();
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Generating Platform Reports..." />;

  const skills = reports?.skillDistribution || [];
  const skillSessions = skills.map((skill) => ({ label: titleCase(skill._id), value: skill.sessions }));
  const skillAccuracy = skills.map((skill) => ({ label: titleCase(skill._id), value: Math.round(skill.averageAccuracy || 0) }));
  const trendValues = new Map((reports?.sessionTrend || []).map((row) => [row._id, row.count]));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const weeklyTrend = Array.from({ length: 5 }, (_, index) => {
    let value = 0;
    let endDate;
    for (let day = index * 7; day < Math.min((index + 1) * 7, 30); day += 1) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - (29 - day));
      value += trendValues.get(date.toISOString().slice(0, 10)) || 0;
      endDate = date;
    }
    return { label: endDate.toISOString().slice(5, 10), value };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Platform Reports" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Learning & Activity Reports</Text>
        <View style={styles.grid}>
          <View style={styles.col}><StatCard icon="checkmark-done" label="Completed Sessions" value={reports?.completedSessions ?? 0} color={COLORS.primary} /></View>
          <View style={styles.col}><StatCard icon="time" label="Avg. Practice Time" value={`${reports?.averagePracticeDuration ?? 0} min`} color="#8B5CF6" /></View>
          <View style={styles.col}><StatCard icon="stats-chart" label="Avg. Accuracy" value={`${reports?.averageAccuracy ?? 0}%`} color={COLORS.success} /></View>
        </View>
        <Card style={styles.card}>
          <VerticalBarChart title="Completed sessions by skill" data={skillSessions} color={COLORS.primary} emptyMessage="No completed sessions yet." />
        </Card>
        <Card style={styles.card}>
          <VerticalBarChart title="Average accuracy by skill (%)" data={skillAccuracy} color="#8B5CF6" emptyMessage="No completed sessions yet." />
        </Card>
        <Card style={styles.card}>
          <PieChart title="Share of completed sessions by skill" data={skillSessions} emptyMessage="No completed sessions yet." />
        </Card>
        <Card style={styles.card}>
          <VerticalBarChart title="Completed sessions · last 30 days" data={weeklyTrend} color={COLORS.success} emptyMessage="No completed sessions in the last 30 days." />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.base },
  pageTitle: { ...FONTS.h2, marginBottom: SPACING.base },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: SPACING.base },
  col: { width: '48%', marginBottom: SPACING.base },
  card: { padding: SPACING.base, marginBottom: SPACING.base },
});

export default ReportsScreen;
