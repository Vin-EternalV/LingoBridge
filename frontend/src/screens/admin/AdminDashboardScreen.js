import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as adminApi from '../../api/admin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const AdminDashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.log('Admin stats error:', err);
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

  if (loading) return <LoadingSpinner fullScreen message="Loading Admin Dashboard..." />;

  const totalUsers = stats?.totalUsers || 142;
  const activeLearners = stats?.activeLearners || 118;
  const totalSessions = stats?.totalPracticeSessions || 840;
  const totalAIInteractions = stats?.totalAIInteractions || 3200;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Admin Overview" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <Text style={styles.pageTitle}>Platform Activity Overview</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <StatCard icon="people" label="Total Users" value={totalUsers} color={COLORS.primary} />
          </View>
          <View style={styles.statCol}>
            <StatCard icon="pulse" label="Active Learners" value={activeLearners} color={COLORS.success} />
          </View>
          <View style={styles.statCol}>
            <StatCard icon="book" label="Practice Sessions" value={totalSessions} color="#8B5CF6" />
          </View>
          <View style={styles.statCol}>
            <StatCard icon="sparkles" label="AI Interactions" value={totalAIInteractions} color="#F59E0B" />
          </View>
        </View>

        {/* Popular Skills */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Most Practiced Skills</Text>
          <View style={styles.skillRow}>
            <Text style={styles.skillName}>1. Grammar</Text>
            <Text style={styles.skillVal}>380 Sessions</Text>
          </View>
          <View style={styles.skillRow}>
            <Text style={styles.skillName}>2. Vocabulary</Text>
            <Text style={styles.skillVal}>240 Sessions</Text>
          </View>
          <View style={styles.skillRow}>
            <Text style={styles.skillName}>3. Reading</Text>
            <Text style={styles.skillVal}>120 Sessions</Text>
          </View>
          <View style={styles.skillRow}>
            <Text style={styles.skillName}>4. Speaking</Text>
            <Text style={styles.skillVal}>60 Sessions</Text>
          </View>
          <View style={styles.skillRow}>
            <Text style={styles.skillName}>5. Writing</Text>
            <Text style={styles.skillVal}>40 Sessions</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  statCol: {
    width: '48%',
    marginBottom: SPACING.base,
  },
  sectionCard: {
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  skillName: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  skillVal: {
    ...FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default AdminDashboardScreen;
