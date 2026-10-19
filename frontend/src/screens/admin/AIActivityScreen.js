import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Header from "../../components/Header";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import VerticalBarChart from "../../components/VerticalBarChart";
import PieChart from "../../components/PieChart";
import LoadingSpinner from "../../components/LoadingSpinner";
import * as adminApi from "../../api/admin";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const AIActivityScreen = () => {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    const fetchAIActivity = async () => {
      try {
        const data = await adminApi.getAIActivity();
        setActivity(data);
      } catch (err) {
        console.log("AI activity fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAIActivity();
  }, []);

  if (loading)
    return (
      <LoadingSpinner fullScreen message="Loading AI Activity metrics..." />
    );

  const totalGenerated = activity?.totalExercisesGenerated ?? 0;
  const totalEvaluations = activity?.totalEvaluations ?? 0;
  const totalChatInteractions = activity?.totalChatInteractions ?? 0;
  const successRate = activity?.successRate ?? 0;
  const byType = activity?.byType || [];
  const typeLabels = { exercise_generation: 'Exercises', feedback: 'Evaluations', assistant_chat: 'Tutor chats' };
  const volumeData = byType.map((item) => ({ label: typeLabels[item._id] || item._id, value: item.count }));
  const outcomeData = [
    { label: 'Successful', value: byType.reduce((sum, item) => sum + (item.successful || 0), 0), color: COLORS.success },
    { label: 'Failed', value: byType.reduce((sum, item) => sum + (item.count - (item.successful || 0)), 0), color: COLORS.error },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="AI Activity Logs" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>AI Service Utilization</Text>

        <View style={styles.grid}>
          <View style={styles.col}>
            <StatCard
              icon="create"
              label="Exercises Generated"
              value={totalGenerated}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.col}>
            <StatCard
              icon="checkmark-circle"
              label="Answers Evaluated"
              value={totalEvaluations}
              color={COLORS.success}
            />
          </View>
          <View style={styles.col}>
            <StatCard
              icon="chatbubbles"
              label="Tutor Chat Requests"
              value={totalChatInteractions}
              color="#8B5CF6"
            />
          </View>
          <View style={styles.col}>
            <StatCard
              icon="pulse"
              label="Service Success Rate"
              value={`${successRate}%`}
              color="#F59E0B"
            />
          </View>
        </View>

        <Card style={styles.card}>
          <VerticalBarChart title="Requests by service" data={volumeData} color="#8B5CF6" emptyMessage="No AI activity recorded yet." />
        </Card>

        <Card style={styles.card}>
          <PieChart title="Request mix by service" data={volumeData} emptyMessage="No AI activity recorded yet." />
        </Card>

        <Card style={styles.card}>
          <PieChart title="Successful and failed requests" data={outcomeData} emptyMessage="No AI requests to measure yet." />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.note}>Success rate is calculated from recorded AI requests across all service types.</Text>
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
  note: { ...FONTS.small, color: COLORS.textSecondary },
});

export default AIActivityScreen;
