import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const SessionSummaryScreen = ({ route, navigation }) => {
  const { skill, topic, difficulty, scoreInfo, duration } = route.params;
  const skillTitle = skill.charAt(0).toUpperCase() + skill.slice(1);
  const percentage = Math.round((scoreInfo.correct / scoreInfo.total) * 100);

  const getTrophyColor = () => {
    if (percentage >= 80) return COLORS.warning; // Gold
    if (percentage >= 60) return '#94A3B8'; // Silver
    return '#B45309'; // Bronze
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Ionicons name="trophy" size={80} color={getTrophyColor()} />
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.subtitle}>Great job practicing your {skillTitle}</Text>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.tagsContainer}>
            <Badge text={skillTitle} variant="info" />
            <View style={{ width: 8 }} />
            <Badge text={difficulty} variant="warning" />
          </View>
          
          <Text style={styles.topicName}>{topic}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{percentage}%</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{scoreInfo.correct}/{scoreInfo.total}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{duration}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Ionicons name="flame" size={24} color={COLORS.warning} />
            <Text style={styles.xpTitle}>+50 XP Earned</Text>
          </View>
          <Text style={styles.xpDesc}>You're on a 4-day streak! Keep it up tomorrow to earn bonus XP.</Text>
        </Card>

      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Review Exercises" 
          onPress={() => navigation.navigate('HistoryDetail', { sessionData: route.params })} 
          variant="outline"
          style={styles.reviewButton}
          fullWidth 
        />
        <Button 
          title="Back to Dashboard" 
          onPress={() => navigation.navigate('Dashboard')} 
          fullWidth 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.xl,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
  },
  statsCard: {
    marginBottom: SPACING.base,
    padding: SPACING.xl,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  topicName: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.h2,
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  statLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  xpCard: {
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  xpTitle: {
    ...FONTS.h4,
    color: '#B45309', // Darker warning color for text
    marginLeft: SPACING.sm,
  },
  xpDesc: {
    ...FONTS.small,
    color: '#92400E',
  },
  footer: {
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reviewButton: {
    marginBottom: SPACING.base,
  },
});

export default SessionSummaryScreen;
