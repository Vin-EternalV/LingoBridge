import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const skillsData = [
  { name: 'Grammar', icon: 'book', accuracy: 0.85, totalSessions: 24, color: COLORS.primary },
  { name: 'Vocabulary', icon: 'text', accuracy: 0.72, totalSessions: 18, color: '#8B5CF6' },
  { name: 'Reading', icon: 'newspaper', accuracy: 0.90, totalSessions: 15, color: '#10B981' },
  { name: 'Writing', icon: 'pencil', accuracy: 0.65, totalSessions: 10, color: '#F59E0B' },
  { name: 'Speaking', icon: 'mic', accuracy: 0.55, totalSessions: 8, color: '#EC4899' },
];

const ProgressScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Your Progress" showBack={false} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.streakContainer}>
          <Card style={styles.streakCard}>
            <Ionicons name="flame" size={32} color={COLORS.warning} />
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>4 Days</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
          </Card>
          <Card style={styles.streakCard}>
            <Ionicons name="trophy" size={32} color={COLORS.primary} />
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>12 Days</Text>
              <Text style={styles.streakLabel}>Longest Streak</Text>
            </View>
          </Card>
        </View>

        <Card style={styles.overallCard}>
          <View style={styles.overallHeader}>
            <Text style={styles.sectionTitle}>Overall Accuracy</Text>
            <Badge text="Upper Intermediate" variant="info" />
          </View>
          <Text style={styles.overallValue}>76%</Text>
          <ProgressBar progress={0.76} showLabel={false} height={12} color={COLORS.primary} />
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Progress</Text>
          {skillsData.map((skill, index) => (
            <Card key={index} style={styles.skillCard}>
              <View style={styles.skillHeader}>
                <View style={styles.skillIconContainer}>
                  <Ionicons name={skill.icon} size={20} color={skill.color} />
                </View>
                <View style={styles.skillInfo}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text style={styles.skillSessions}>{skill.totalSessions} sessions</Text>
                </View>
                <Text style={styles.skillAccuracy}>{Math.round(skill.accuracy * 100)}%</Text>
              </View>
              <ProgressBar progress={skill.accuracy} color={skill.color} height={8} showLabel={false} />
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Missed Areas</Text>
          <View style={styles.missedTags}>
            <Badge text="Prepositions" variant="error" />
            <Badge text="Present Perfect" variant="warning" />
            <Badge text="Business Vocab" variant="warning" />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyButtonText}>View Practice History</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.primaryDark} />
        </TouchableOpacity>

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
    paddingBottom: SPACING.xxl,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  streakCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    marginBottom: 0,
  },
  streakInfo: {
    marginLeft: SPACING.sm,
  },
  streakValue: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  streakLabel: {
    ...FONTS.tiny,
    color: COLORS.textSecondary,
  },
  overallCard: {
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  overallValue: {
    ...FONTS.h1,
    color: COLORS.primaryDark,
    marginBottom: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  skillCard: {
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  skillIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    ...FONTS.regular,
    fontWeight: '600',
    color: COLORS.text,
  },
  skillSessions: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  skillAccuracy: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  missedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.base,
  },
  historyButtonText: {
    ...FONTS.regular,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginRight: SPACING.sm,
  },
});

export default ProgressScreen;
