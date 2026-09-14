import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as superAdminApi from '../../api/superadmin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const PlatformAnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await superAdminApi.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.log('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Loading Platform Analytics..." />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Platform Analytics" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Growth & Engagement Insights</Text>

        <View style={styles.grid}>
          <View style={styles.col}>
            <StatCard icon="trending-up" label="User Growth Rate" value="+24%" color={COLORS.primary} />
          </View>
          <View style={styles.col}>
            <StatCard icon="time" label="Daily Avg Practice" value="18 mins" color={COLORS.success} />
          </View>
          <View style={styles.col}>
            <StatCard icon="repeat" label="7-Day Retention" value="86%" color="#8B5CF6" />
          </View>
          <View style={styles.col}>
            <StatCard icon="checkmark-done" label="Completion Rate" value="91%" color="#F59E0B" />
          </View>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Demographics & Target Audience</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Primary Audience</Text>
            <Text style={styles.val}>Filipino English Learners</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Global Expansion Ready</Text>
            <Text style={styles.val}>Yes (Multi-region Architecture)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Most Requested Area</Text>
            <Text style={styles.val}>Grammar & Sentence Correction</Text>
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
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  val: {
    ...FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default PlatformAnalyticsScreen;
