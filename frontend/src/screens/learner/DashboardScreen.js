import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import SkillCard from '../../components/SkillCard';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const firstName = user?.firstName || 'Learner';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}! 👋</Text>
            <Text style={styles.subGreeting}>Ready to learn English today?</Text>
          </View>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={20} color={COLORS.warning} />
            <Text style={styles.streakText}>3</Text>
          </View>
        </View>

        <Card style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Overall Progress</Text>
          <ProgressBar progress={0.35} showLabel={true} label="Intermediate Level" />
        </Card>

        <View style={styles.actionCardsContainer}>
          <Card 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Practice')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="play" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Continue Learning</Text>
              <Text style={styles.actionDesc}>Grammar: Past Tense</Text>
            </View>
          </Card>
          
          <Card 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Practice')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="flash" size={24} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Quick Practice</Text>
              <Text style={styles.actionDesc}>5 mins daily review</Text>
            </View>
          </Card>
        </View>

        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>Your Skills</Text>
          <View style={styles.skillsGrid}>
            <View style={styles.skillColumn}>
              <SkillCard skill="Grammar" progress={0.4} />
              <SkillCard skill="Reading" progress={0.6} />
            </View>
            <View style={styles.skillColumn}>
              <SkillCard skill="Vocabulary" progress={0.5} />
              <SkillCard skill="Speaking" progress={0.2} />
            </View>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.recentCard}>
            <View style={styles.recentIcon}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>
            <View style={styles.recentContent}>
              <Text style={styles.recentTitle}>Completed: Basic Greetings</Text>
              <Text style={styles.recentTime}>Yesterday</Text>
            </View>
          </Card>
          <Card style={styles.recentCard}>
            <View style={styles.recentIcon}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>
            <View style={styles.recentContent}>
              <Text style={styles.recentTitle}>Vocab Quiz: 10/10</Text>
              <Text style={styles.recentTime}>2 days ago</Text>
            </View>
          </Card>
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.base,
  },
  greeting: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  subGreeting: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  streakText: {
    ...FONTS.h4,
    color: COLORS.warning,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  progressCard: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  actionCard: {
    width: '48%',
    marginBottom: 0,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionContent: {
    marginTop: SPACING.xs,
  },
  actionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  actionDesc: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  skillsSection: {
    marginBottom: SPACING.xl,
  },
  skillsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillColumn: {
    width: '48%',
  },
  recentSection: {
    marginBottom: SPACING.base,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
  },
  recentIcon: {
    marginRight: SPACING.base,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    ...FONTS.regular,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentTime: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default DashboardScreen;
