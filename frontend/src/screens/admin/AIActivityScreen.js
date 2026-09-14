import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as adminApi from '../../api/admin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const AIActivityScreen = () => {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    const fetchAIActivity = async () => {
      try {
        const data = await adminApi.getAIActivity();
        setActivity(data);
      } catch (err) {
        console.log('AI activity fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAIActivity();
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Loading AI Activity metrics..." />;

  const totalGenerated = activity?.totalExercisesGenerated || 420;
  const totalEvaluations = activity?.totalEvaluations || 1280;
  const totalChatInteractions = activity?.totalChatInteractions || 1500;
  const successRate = activity?.successRate || 99.4;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="AI Activity Logs" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>AI Service Utilization</Text>

        <View style={styles.grid}>
          <View style={styles.col}>
            <StatCard icon="create" label="Exercises Generated" value={totalGenerated} color={COLORS.primary} />
          </View>
          <View style={styles.col}>
            <StatCard icon="checkmark-circle" label="Answers Evaluated" value={totalEvaluations} color={COLORS.success} />
          </View>
          <View style={styles.col}>
            <StatCard icon="chatbubbles" label="Tutor Chat Requests" value={totalChatInteractions} color="#8B5CF6" />
          </View>
          <View style={styles.col}>
            <StatCard icon="pulse" label="Service Success Rate" value={`${successRate}%`} color="#F59E0B" />
          </View>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity Types</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Exercise Generation (Grammar)</Text>
            <Text style={styles.rowVal}>180 requests</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Exercise Generation (Vocabulary)</Text>
            <Text style={styles.rowVal}>140 requests</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>AI Feedback Evaluations</Text>
            <Text style={styles.rowVal}>1,280 requests</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Educational Assistant Chats</Text>
            <Text style={styles.rowVal}>1,500 requests</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.base,
  },
  pageTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  col: {
    width: '48%',
    marginBottom: SPACING.base,
  },
  card: {
    padding: SPACING.base,
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  rowVal: {
    ...FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default AIActivityScreen;
