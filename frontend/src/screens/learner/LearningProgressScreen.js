import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusMessage from '../../components/StatusMessage';
import * as usersApi from '../../api/users';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const LEVELS = [
  { id: 'beginner', label: 'Easy / Beginner', total: 20 },
  { id: 'intermediate', label: 'Intermediate', total: 40 },
  { id: 'advanced', label: 'Advanced', total: 0 },
];
const title = (value) => LEVELS.find((item) => item.id === value)?.label || 'Easy / Beginner';

export default function LearningProgressScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setError(''); setData(await usersApi.getLearningProgress()); }
    catch (err) { setError(err.response?.data?.message || 'Could not load your learning progress.'); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (!data && !error) return <Screen title="Learning progression"><LoadingSpinner fullScreen message="Loading progress..." /></Screen>;

  const currentIndex = LEVELS.findIndex((level) => level.id === data?.currentLevel);
  return (
    <Screen title="Learning progression">
      <View style={styles.content}>
        <StatusMessage type="error" message={error} />
        {data && <>
          <Card>
            <Text style={styles.eyebrow}>CURRENT ENGLISH LEVEL</Text>
            <Text style={styles.heading}>{title(data.currentLevel)}</Text>
            {data.requiredSessions > 0 ? <>
              <Text style={styles.copy}>{data.completedSessions}/{data.requiredSessions} sessions completed</Text>
              <ProgressBar progress={data.requiredSessions ? data.completedSessions / data.requiredSessions : 1} showLabel={false} />
            </> : <Text style={styles.copy}>{data.completedSessions} practice sessions completed at Advanced level.</Text>}
            <View style={styles.difficultyRow}><Ionicons name="checkmark-circle" size={18} color={COLORS.success} /><Text style={styles.copy}>Unlocked difficulty: {data.unlockedDifficulties?.join(', ')}</Text></View>
          </Card>

          {data.skills?.map((skill) => <Card key={skill.id} style={styles.skillCard}>
            <View style={styles.row}><Text style={styles.skill}>{skill.id[0].toUpperCase() + skill.id.slice(1)}</Text><Text style={styles.copy}>{skill.required ? `${skill.completed}/${skill.required} sessions` : `${skill.completed} sessions`}</Text></View>
            {skill.required > 0 && <ProgressBar progress={skill.completed / skill.required} showLabel={false} height={7} />}
          </Card>)}

          <Text style={styles.section}>Level access</Text>
          {LEVELS.map((level, index) => {
            const unlocked = index <= currentIndex;
            const previous = LEVELS[index - 1];
            const required = previous?.total || 0;
            const levelCounts = data.levelProgress?.[level.id] || {};
            const levelSessions = ['grammar', 'vocabulary', 'reading', 'writing', 'speaking'].reduce((sum, skill) => sum + (Number(levelCounts[skill]) || 0), 0);
            return <Card key={level.id} style={styles.levelCard}>
              <Ionicons name={unlocked ? 'checkmark-circle' : 'lock-closed'} size={22} color={unlocked ? COLORS.success : COLORS.textLight} />
              <View style={styles.levelText}>
                <Text style={styles.skill}>{level.label}{index === currentIndex ? ' · Current' : ''}</Text>
                <Text style={styles.copy}>{level.total ? `${levelSessions}/${level.total} sessions` : `${levelSessions} sessions completed`}</Text>
                {!unlocked && <Text style={styles.copy}>Complete {required} sessions in {previous.label} to unlock this level.</Text>}
                {index < currentIndex && level.id === 'beginner' && data.advancementDates?.beginnerCompletedAt && <Text style={styles.copy}>Unlocked {new Date(data.advancementDates.beginnerCompletedAt).toLocaleDateString()}</Text>}
                {index < currentIndex && level.id === 'intermediate' && data.advancementDates?.intermediateCompletedAt && <Text style={styles.copy}>Unlocked {new Date(data.advancementDates.intermediateCompletedAt).toLocaleDateString()}</Text>}
              </View>
            </Card>;
          })}

          {data.ageEligible && <>
            <Text style={styles.section}>IELTS preparation</Text>
            <Card style={styles.ieltsCard} onPress={() => {
              if (data.ieltsAccess) navigation.navigate('MainTabs', { screen: 'PracticeTab' });
              else if (data.currentLevel === 'advanced') navigation.navigate('IeltsVerification');
            }}>
              <Ionicons name={data.ieltsAccess ? 'checkmark-circle' : 'lock-closed'} size={22} color={data.ieltsAccess ? COLORS.success : COLORS.textLight} />
              <View style={styles.levelText}>
                <Text style={styles.skill}>{data.ieltsAccess ? 'IELTS is unlocked' : 'IELTS is locked'}</Text>
                <Text style={styles.copy}>{data.ieltsLockReason === 'level' ? 'Reach Advanced English to unlock IELTS preparation.' : data.ieltsLockReason === 'verification' ? 'Verify your age and identity to access IELTS preparation.' : 'IELTS preparation is available.'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={COLORS.textLight} />
            </Card>
          </>}
        </>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  eyebrow: { ...FONTS.tiny, letterSpacing: 1, fontWeight: '700' },
  heading: { ...FONTS.h2, marginVertical: SPACING.sm },
  section: { ...FONTS.h3, marginTop: SPACING.base, marginBottom: SPACING.sm },
  skill: { ...FONTS.regular, fontWeight: '600', textTransform: 'capitalize' },
  copy: { ...FONTS.small, marginVertical: 4, flexShrink: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
  skillCard: { paddingVertical: SPACING.sm },
  difficultyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SPACING.sm },
  levelCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  ieltsCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  levelText: { flex: 1 },
});
