import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as adminApi from '../../api/admin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const ReportsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await adminApi.getReports();
        setReports(data);
      } catch (err) {
        console.log('Reports fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Generating Platform Reports..." />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Platform Reports" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Learning & Activity Reports</Text>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Common Difficulty Areas across Learners</Text>
          <View style={styles.item}>
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Prepositions & Articles</Text>
              <Text style={styles.itemVal}>42% of learners</Text>
            </View>
            <ProgressBar progress={0.42} showLabel={false} height={6} color={COLORS.error} />
          </View>
          <View style={styles.item}>
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Subject-Verb Agreement</Text>
              <Text style={styles.itemVal}>35% of learners</Text>
            </View>
            <ProgressBar progress={0.35} showLabel={false} height={6} color={COLORS.warning} />
          </View>
          <View style={styles.item}>
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Writing Vocabulary Nuances</Text>
              <Text style={styles.itemVal}>28% of learners</Text>
            </View>
            <ProgressBar progress={0.28} showLabel={false} height={6} color={COLORS.primary} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>User Engagement Summary</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Average Practice Duration</Text>
            <Text style={styles.statVal}>12 minutes / session</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Average Accuracy Rate</Text>
            <Text style={styles.statVal}>76.4%</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Retention (Active 7 Days)</Text>
            <Text style={styles.statVal}>83%</Text>
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
  card: {
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  item: {
    marginBottom: SPACING.base,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemLabel: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  itemVal: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  statVal: {
    ...FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default ReportsScreen;
