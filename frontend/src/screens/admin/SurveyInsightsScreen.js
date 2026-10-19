import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import AnalyticsBarChart from '../../components/AnalyticsBarChart';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusMessage from '../../components/StatusMessage';
import * as adminApi from '../../api/admin';
import { titleCase } from '../../utils/format';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const SKILLS = ['grammar', 'vocabulary', 'reading', 'speaking', 'writing'];
const SCALE_COLORS = ['#34D399', '#84CC16', '#FBBF24', '#FB923C', '#EF4444'];
const FREQUENCY_LABELS = {
  never: 'Never',
  rarely: 'Rarely',
  weekly: 'About weekly',
  several_times_week: 'Several times a week',
  daily: 'Daily',
};

const DistributionRow = ({ skill, distribution, mean }) => {
  const counts = distribution?.counts || {};
  const total = Object.values(counts).reduce((sum, count) => sum + (Number(count) || 0), 0);
  return (
    <View style={styles.skillBlock}>
      <View style={styles.skillHeading}>
        <Text style={styles.skillName}>{titleCase(skill)}</Text>
        <Text style={styles.meanValue}>Mean {Number(mean || 0).toFixed(2)} / 5</Text>
      </View>
      <View style={styles.stackedBar} accessibilityLabel={`${titleCase(skill)} difficulty distribution`}>
        {[1, 2, 3, 4, 5].map((rating) => {
          const count = Number(counts[rating]) || 0;
          if (!count || !total) return null;
          return <View key={rating} style={{ flex: count, height: '100%', backgroundColor: SCALE_COLORS[rating - 1] }} />;
        })}
      </View>
      <View style={styles.countsRow}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Text key={rating} style={styles.countLabel}>
            <Text style={{ color: SCALE_COLORS[rating - 1] }}>● </Text>{rating}: {counts[rating] || 0}
          </Text>
        ))}
      </View>
    </View>
  );
};

const SurveyInsightsScreen = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      setError('');
      setSummary(await adminApi.getSurveySummary());
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load survey insights. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  if (loading) return <LoadingSpinner fullScreen message="Loading survey insights..." />;

  const ranking = summary?.priorityRanking || [];
  const frequencyData = (summary?.practiceFrequency || []).map((item) => ({
    label: FREQUENCY_LABELS[item.frequency] || titleCase(item.frequency),
    value: item.count,
  }));
  const timeSpent = summary?.timeSpent || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSummary(); }} colors={[COLORS.primary]} />}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.pageTitle}>Survey Insights</Text>
            <Text style={styles.subtitle}>Use learner-reported needs to guide learning content priorities.</Text>
          </View>
          <TouchableOpacity onPress={fetchSummary} style={styles.refreshButton} accessibilityRole="button" accessibilityLabel="Refresh survey insights">
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <StatusMessage type="error" message={error} />

        <View style={styles.statsGrid}>
          <View style={styles.statCol}><StatCard icon="clipboard" label="Survey responses" value={summary?.totalResponses ?? 0} color={COLORS.primary} /></View>
          <View style={styles.statCol}><StatCard icon="people" label="Learner response rate" value={`${summary?.responseRate ?? 0}%`} color="#8B5CF6" /></View>
        </View>
        <Text style={styles.coverageNote}>{summary?.totalResponses ?? 0} responses from {summary?.totalLearners ?? 0} learner accounts. Each learner has one current survey response.</Text>

        {(summary?.totalResponses ?? 0) === 0 ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>No survey responses yet</Text>
            <Text style={styles.body}>Insights will appear here after learners complete the survey.</Text>
          </Card>
        ) : <>
          <Card style={styles.sectionCard}>
            <AnalyticsBarChart
              title="Skills to prioritize · mean difficulty"
              data={ranking.map((item) => ({ label: titleCase(item.skill), value: Number(item.meanDifficulty.toFixed(2)) }))}
              color="#8B5CF6"
              emptyMessage="No difficulty ratings available."
            />
            <Text style={styles.chartNote}>Higher scores mean learners report more difficulty. Scale: 1 (easier) to 5 (harder).</Text>
            {summary?.insights?.recommendation ? <Text style={styles.recommendation}>{summary.insights.recommendation}</Text> : null}
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Difficulty rating distribution</Text>
            <Text style={styles.body}>Counts for each response on the 1–5 scale, shown per skill.</Text>
            <View style={styles.legendRow}>
              {[1, 2, 3, 4, 5].map((rating) => <Text key={rating} style={styles.legendItem}><Text style={{ color: SCALE_COLORS[rating - 1] }}>● </Text>{rating}</Text>)}
            </View>
            {SKILLS.map((skill) => (
              <DistributionRow key={skill} skill={skill} distribution={summary?.distribution?.[skill]} mean={summary?.meanDifficulty?.[skill]} />
            ))}
          </Card>

          <Card style={styles.sectionCard}>
            <AnalyticsBarChart title="How often learners practice" data={frequencyData} color={COLORS.primary} emptyMessage="No practice frequency answers." labelWidth={155} labelLines={2} />
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Typical study plan</Text>
            <View style={styles.timeRow}><Text style={styles.timeLabel}>Minutes per session</Text><Text style={styles.timeValue}>{timeSpent.avgMinutesPerSession ?? 0} min</Text></View>
            <View style={styles.timeRow}><Text style={styles.timeLabel}>Sessions per week</Text><Text style={styles.timeValue}>{timeSpent.avgSessionsPerWeek ?? 0}</Text></View>
            <View style={[styles.timeRow, styles.lastTimeRow]}><Text style={styles.timeLabel}>Estimated weekly practice</Text><Text style={styles.timeValue}>{timeSpent.avgWeeklyMinutes ?? 0} min</Text></View>
          </Card>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.base },
  titleCopy: { flex: 1, paddingRight: SPACING.sm },
  pageTitle: { ...FONTS.h2, marginBottom: SPACING.xs },
  subtitle: { ...FONTS.small, lineHeight: 20 },
  refreshButton: { padding: SPACING.sm, borderRadius: 20, backgroundColor: COLORS.primaryLight },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -SPACING.xs },
  statCol: { width: '50%', marginBottom: SPACING.xs },
  coverageNote: { ...FONTS.tiny, marginBottom: SPACING.base, marginHorizontal: SPACING.xs },
  sectionCard: { padding: SPACING.base, marginBottom: SPACING.base },
  sectionTitle: { ...FONTS.h3, marginBottom: SPACING.xs },
  body: { ...FONTS.small, lineHeight: 20 },
  chartNote: { ...FONTS.tiny, marginTop: SPACING.sm, lineHeight: 18 },
  recommendation: { ...FONTS.small, color: COLORS.primary, fontWeight: '600', marginTop: SPACING.md, lineHeight: 20 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md, marginBottom: SPACING.sm },
  legendItem: { ...FONTS.tiny },
  skillBlock: { paddingVertical: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  skillHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  skillName: { ...FONTS.regular, fontWeight: '600' },
  meanValue: { ...FONTS.tiny, fontWeight: '600' },
  stackedBar: { height: 12, borderRadius: 8, backgroundColor: COLORS.border, overflow: 'hidden', flexDirection: 'row' },
  countsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  countLabel: { ...FONTS.tiny, fontSize: 11 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  lastTimeRow: { borderBottomWidth: 0 },
  timeLabel: { ...FONTS.small },
  timeValue: { ...FONTS.small, color: COLORS.text, fontWeight: '700' },
});

export default SurveyInsightsScreen;
