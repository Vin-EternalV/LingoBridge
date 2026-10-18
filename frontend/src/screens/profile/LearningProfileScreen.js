import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import * as usersApi from '../../api/users';
import { getErrorMessage } from '../../utils/errors';
import Screen from '../../components/Screen';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { LEVELS, GOALS, AREAS, DIFFICULTIES } from '../../constants/learningOptions';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const toggle = (list, id) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
const sameSet = (a = [], b = []) => a.length === b.length && a.every((item) => b.includes(item));

const LearningProfileScreen = () => {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const [saved, setSaved] = useState(null); // last values from the server
  const [level, setLevel] = useState(null);
  const [goals, setGoals] = useState([]);
  const [areas, setAreas] = useState([]);
  const [difficulties, setDifficulties] = useState([]);

  const applyProfile = (profile) => {
    const values = {
      level: ({ elementary: 'beginner', upper_intermediate: 'intermediate' })[profile?.currentEnglishLevel || profile?.englishLevel] || profile?.currentEnglishLevel || profile?.englishLevel || null,
      goals: profile?.learningGoals || [],
      areas: profile?.preferredAreas || [],
      difficulties: profile?.areasOfDifficulty || [],
    };
    setSaved(values);
    setLevel(values.level);
    setGoals(values.goals);
    setAreas(values.areas);
    setDifficulties(values.difficulties);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await refreshUser();
        if (active) applyProfile(data.profile);
      } catch (err) {
        if (active) setStatus({ type: 'error', message: getErrorMessage(err) });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const dirty =
    !!saved &&
    (!sameSet(goals, saved.goals) ||
      !sameSet(areas, saved.areas) ||
      !sameSet(difficulties, saved.difficulties));

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const profile = await usersApi.updateLearningProfile({
        learningGoals: goals,
        preferredAreas: areas,
        areasOfDifficulty: difficulties,
      });
      applyProfile(profile);
      await refreshUser();
      setStatus({ type: 'success', message: 'Learning profile saved.' });
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const renderChips = (options, selected, setter) => (
    <View style={styles.chipWrap}>
      {options.map((option) => (
        <Chip
          key={option.id}
          label={option.title}
          selected={selected.includes(option.id)}
          onPress={() => {
            setStatus(null);
            setter(toggle(selected, option.id));
          }}
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <Screen title="Learning Profile">
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen title="Learning Profile">
      <Text style={styles.intro}>
      Your answers here shape practice recommendations. Complete sessions to unlock the next level.
      </Text>

      <StatusMessage type={status?.type} message={status?.message} />

      <SectionLabel>English level</SectionLabel>
      <View style={styles.levelList}>
        {(() => {
          const currentIndex = LEVELS.findIndex((item) => item.id === level);
          return LEVELS.map((item, index) => {
            const selected = level === item.id;
            const unlocked = currentIndex >= 0 && index <= currentIndex;
            return <View key={item.id} style={[styles.levelRow, index > 0 && styles.levelDivider, !unlocked && styles.lockedLevel]}>
              <Ionicons name={unlocked ? 'checkmark-circle' : 'lock-closed'} size={22} color={unlocked ? COLORS.primary : COLORS.textLight} />
              <View style={styles.levelText}>
                <Text style={styles.levelTitle}>{item.title}{selected ? ' · Current' : ''}</Text>
                <Text style={styles.levelDesc}>{item.description}</Text>
              </View>
            </View>;
          });
        })()}
      </View>
      <Text style={styles.lockHint}>Your starting level is locked. Complete the required sessions in each skill to advance.</Text>

      <SectionLabel hint="Pick everything you want to work towards.">Learning goals</SectionLabel>
      {renderChips(GOALS, goals, setGoals)}

      <SectionLabel hint="The skills you want to practise most.">Preferred areas</SectionLabel>
      {renderChips(AREAS, areas, setAreas)}

      <SectionLabel hint="We'll give these extra attention.">Areas of difficulty</SectionLabel>
      {renderChips(DIFFICULTIES, difficulties, setDifficulties)}

      <Button
        title="Save changes"
        onPress={handleSave}
        loading={saving}
        disabled={!dirty}
        fullWidth
        style={styles.saveButton}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: SPACING.xxxl },
  intro: { ...FONTS.small, marginBottom: SPACING.base },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  levelList: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base },
  lockedLevel: { opacity: 0.55 },
  lockHint: { ...FONTS.small, color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: SPACING.base },
  levelDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  levelText: { marginLeft: SPACING.md, flex: 1 },
  levelTitle: { ...FONTS.regular, fontWeight: '600' },
  levelDesc: { ...FONTS.small, marginTop: 2 },
  saveButton: { marginTop: SPACING.xl },
});

export default LearningProfileScreen;
