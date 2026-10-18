import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import {
  getMock,
  deleteMock,
  startReading,
  getReadingTest,
  getWritingPrompt,
  getSpeakingSet,
} from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { formatBand, bandColor } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const RESULT_ROUTE = { reading: 'IeltsReadingResult', writing: 'IeltsWritingResult', speaking: 'IeltsSpeakingResult' };

const IeltsMockScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [mock, setMock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  // Reload every time we come back here (after finishing a section).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMock(id)
        .then((m) => active && setMock(m))
        .catch((err) => active && setError(getErrorMessage(err, 'Could not load this mock test.')))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [id])
  );

  const startSection = async (section) => {
    if (busy) return;
    setBusy(section.key);
    setError('');
    try {
      if (section.key === 'reading') {
        let test = null;
        if (section.refId) {
          // The passage was already created: carry on with it instead of making a new one.
          try {
            const existing = await getReadingTest(section.refId);
            if (existing.status === 'ready') test = existing.test;
          } catch (e) {
            test = null;
          }
        }
        if (!test) test = await startReading({ mockId: id });
        navigation.navigate('IeltsReadingTask', { test, mockId: id });
      } else if (section.key === 'writing1' || section.key === 'writing2') {
        const task = await getWritingPrompt({ task: section.key === 'writing1' ? 'task1' : 'task2', module: 'academic' });
        navigation.navigate('IeltsWritingTask', { task, mockId: id });
      } else {
        const set = await getSpeakingSet({ part: `part${section.key.slice(-1)}` });
        navigation.navigate('IeltsSpeakingTask', { set, mockId: id });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not start this section. Please try again.'));
    } finally {
      setBusy('');
    }
  };

  const abandon = async () => {
    const ok = await confirmAction('Abandon this mock test?', 'Your finished sections stay in your practice history, but this mock test will be removed.', {
      confirmText: 'Abandon',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteMock(id);
      navigation.navigate('IeltsProgress');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not remove this mock test.'));
    }
  };

  if (loading) {
    return (
      <Screen title="Mock test">
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      </Screen>
    );
  }
  if (!mock) {
    return (
      <Screen title="Mock test">
        <StatusMessage type="error" message={error || 'Could not load this mock test.'} />
      </Screen>
    );
  }

  const completed = mock.status === 'completed';
  const nextIndex = mock.sections.findIndex((s) => s.status === 'pending');
  const doneCount = mock.sections.filter((s) => s.status === 'done').length;

  return (
    <Screen title={mock.type === 'full' ? 'Full mock test' : 'Short mock test'}>
      <StatusMessage type="error" message={error} />

      {completed ? (
        <View style={styles.hero}>
          <View style={[styles.circle, { borderColor: bandColor(mock.overall) }]}>
            <Text style={[styles.circleText, { color: bandColor(mock.overall) }]}>{formatBand(mock.overall)}</Text>
          </View>
          <Text style={styles.heroTitle}>Estimated overall band</Text>
          <View style={styles.skillRow}>
            {['reading', 'writing', 'speaking'].map(
              (k) =>
                typeof mock.skillBands[k] === 'number' && (
                  <View key={k} style={styles.skillBox}>
                    <Text style={[styles.skillBand, { color: bandColor(mock.skillBands[k]) }]}>{formatBand(mock.skillBands[k])}</Text>
                    <Text style={styles.skillName}>{k[0].toUpperCase() + k.slice(1)}</Text>
                  </View>
                )
            )}
          </View>
          <Text style={styles.disclaimer}>{mock.note} Estimates only, not official IELTS results.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.intro}>
            Work through the sections in order, in one sitting if you can. Each one is timed and marked. When the last section is
            done you get one estimated band. {doneCount} of {mock.sections.length} sections finished.
          </Text>
        </>
      )}

      <SectionLabel>Sections</SectionLabel>
      {mock.sections.map((s, i) => {
        const done = s.status === 'done';
        const isNext = !completed && i === nextIndex;
        const locked = !done && !isNext;
        return (
          <Card key={s.key} style={[styles.section, isNext && styles.sectionNext, locked && styles.sectionLocked]}>
            <View style={styles.sectionRow}>
              <Ionicons
                name={done ? 'checkmark-circle' : isNext ? 'play-circle' : 'lock-closed'}
                size={26}
                color={done ? COLORS.success : isNext ? COLORS.primary : COLORS.textLight}
              />
              <View style={styles.sectionText}>
                <Text style={styles.sectionTitle}>{s.label}</Text>
                <Text style={styles.sectionDetail}>{s.detail}</Text>
              </View>
              {done && typeof s.band === 'number' && (
                <Text style={[styles.sectionBand, { color: bandColor(s.band) }]}>{formatBand(s.band)}</Text>
              )}
            </View>
            {isNext && (
              <Button
                title={s.refId && s.key === 'reading' ? 'Continue' : `Start ${s.label}`}
                onPress={() => startSection(s)}
                loading={busy === s.key}
                disabled={!!busy}
                fullWidth
                style={styles.sectionButton}
              />
            )}
            {done && s.refId && (
              <Button
                title="View result"
                variant="text"
                onPress={() => navigation.navigate(RESULT_ROUTE[s.skill], { id: s.refId })}
                fullWidth
              />
            )}
          </Card>
        );
      })}

      {completed ? (
        <Button title="Back to my progress" onPress={() => navigation.navigate('IeltsProgress')} fullWidth style={styles.gap} />
      ) : (
        <Button title="Abandon this mock test" variant="text" onPress={abandon} fullWidth />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  intro: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SPACING.sm, lineHeight: 20 },
  hero: { alignItems: 'center', marginBottom: SPACING.base },
  circle: { width: 128, height: 128, borderRadius: 64, borderWidth: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card },
  circleText: { fontSize: 44, fontWeight: '800' },
  heroTitle: { ...FONTS.h4, marginTop: SPACING.md },
  skillRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  skillBox: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base, alignItems: 'center' },
  skillBand: { ...FONTS.h3 },
  skillName: { ...FONTS.tiny },
  disclaimer: { ...FONTS.tiny, marginTop: SPACING.sm, textAlign: 'center' },
  section: { padding: SPACING.base },
  sectionNext: { borderWidth: 2, borderColor: COLORS.primary },
  sectionLocked: { opacity: 0.6 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  sectionText: { flex: 1 },
  sectionTitle: { ...FONTS.regular, fontWeight: '700' },
  sectionDetail: { ...FONTS.tiny, marginTop: 2 },
  sectionBand: { ...FONTS.h3 },
  sectionButton: { marginTop: SPACING.md },
  gap: { marginTop: SPACING.sm },
});

export default IeltsMockScreen;
