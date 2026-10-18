import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { getProgress, setTargetBand, startMock } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { formatBand, bandColor } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const TARGETS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5];

const SKILLS = [
  { key: 'reading', label: 'Reading', icon: 'book', route: 'IeltsReading' },
  { key: 'writing', label: 'Writing', icon: 'create', route: 'IeltsWriting' },
  { key: 'speaking', label: 'Speaking', icon: 'chatbubbles', route: 'IeltsSpeaking' },
];

// A row of small bars: one per recent result, oldest on the left.
const Trend = ({ values }) => (
  <View style={styles.trend}>
    {values.map((band, i) => (
      <View key={i} style={[styles.bar, { height: Math.max(4, (band / 9) * 40), backgroundColor: bandColor(band) }]} />
    ))}
  </View>
);

const IeltsProgressScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProgress()
        .then((d) => active && setData(d))
        .catch((err) => active && setError(getErrorMessage(err, 'Could not load your progress.')))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [])
  );

  const chooseTarget = async (band) => {
    const previous = data.targetBand;
    setData((d) => ({ ...d, targetBand: band })); // show it straight away
    try {
      await setTargetBand(band);
    } catch (err) {
      setData((d) => ({ ...d, targetBand: previous }));
      setError(getErrorMessage(err, 'Could not save your target.'));
    }
  };

  const beginMock = async (type) => {
    if (busy) return;
    setBusy(type);
    setError('');
    try {
      const mock = await startMock(type);
      navigation.navigate('IeltsMock', { id: mock.id });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not start the mock test.'));
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <Screen title="My IELTS progress">
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen title="My IELTS progress">
        <StatusMessage type="error" message={error || 'Could not load your progress.'} />
      </Screen>
    );
  }

  const gap = data.targetBand && data.estimatedOverall != null ? Math.round((data.targetBand - data.estimatedOverall) * 2) / 2 : null;

  return (
    <Screen title="My IELTS progress">
      <StatusMessage type="error" message={error} />

      <View style={styles.hero}>
        {data.estimatedOverall != null ? (
          <>
            <View style={[styles.circle, { borderColor: bandColor(data.estimatedOverall) }]}>
              <Text style={[styles.circleText, { color: bandColor(data.estimatedOverall) }]}>{formatBand(data.estimatedOverall)}</Text>
            </View>
            <Text style={styles.heroTitle}>Estimated overall band</Text>
            {gap != null && (
              <Text style={styles.heroMeta}>
                {gap > 0 ? `${gap.toFixed(1)} below your target of ${formatBand(data.targetBand)}` : `You've reached your target of ${formatBand(data.targetBand)}`}
              </Text>
            )}
            <Text style={styles.disclaimer}>
              Based on your latest 5 results in {data.skillsUsed} of 3 skills. Listening is not included, so this is not a full IELTS overall band.
            </Text>
          </>
        ) : (
          <Text style={styles.empty}>Do a Reading, Writing or Speaking practice and your estimated band appears here.</Text>
        )}
      </View>

      <SectionLabel hint="Pick the band you are aiming for.">Your target band</SectionLabel>
      <View style={styles.chipRow}>
        {TARGETS.map((band) => (
          <Chip key={band} label={band.toFixed(1)} selected={data.targetBand === band} onPress={() => chooseTarget(band)} style={styles.chip} />
        ))}
      </View>

      <SectionLabel>Your skills</SectionLabel>
      {SKILLS.map((skill) => {
        const s = data.skills[skill.key];
        return (
          <Card key={skill.key} style={styles.skill}>
            <View style={styles.skillHead}>
              <Ionicons name={skill.icon} size={20} color={COLORS.primary} />
              <Text style={styles.skillName}>{skill.label}</Text>
              {s.count > 0 && <Text style={styles.skillCount}>{s.count} {s.count === 1 ? 'result' : 'results'}</Text>}
            </View>
            {s.count > 0 ? (
              <>
                <View style={styles.skillStats}>
                  <View style={styles.skillStat}>
                    <Text style={[styles.skillValue, { color: bandColor(s.latest) }]}>{formatBand(s.latest)}</Text>
                    <Text style={styles.skillLabel}>Latest</Text>
                  </View>
                  <View style={styles.skillStat}>
                    <Text style={styles.skillValue}>{s.average.toFixed(1)}</Text>
                    <Text style={styles.skillLabel}>Average</Text>
                  </View>
                  <View style={styles.skillStat}>
                    <Text style={[styles.skillValue, { color: bandColor(s.best) }]}>{formatBand(s.best)}</Text>
                    <Text style={styles.skillLabel}>Best</Text>
                  </View>
                  <Trend values={s.trend} />
                </View>
              </>
            ) : (
              <Text style={styles.noResults}>No results yet.</Text>
            )}
            <Button title={`Practise ${skill.label}`} variant="outline" onPress={() => navigation.navigate(skill.route)} fullWidth style={styles.practise} />
          </Card>
        );
      })}

      {data.focus && (
        <>
          <SectionLabel>Focus next</SectionLabel>
          <Card style={styles.focus}>
            <Text style={styles.focusText}>
              {data.focus.onlyOneSkill
                ? `So far you have only practised ${data.focus.skill}. Try the other skills to see your whole picture.`
                : `Your lowest skill right now is ${data.focus.skill}.`}
              {data.focus.criterion ? ` Within it, ${data.focus.criterion} is the criterion to work on.` : ''}
            </Text>
          </Card>
        </>
      )}

      <SectionLabel hint="Timed sections in order, marked together into one estimated band.">Mock test</SectionLabel>
      {data.mockInProgress ? (
        <Card style={styles.mockCard}>
          <Text style={styles.mockTitle}>You have a {data.mockInProgress.type} mock test in progress</Text>
          <Button title="Continue mock test" onPress={() => navigation.navigate('IeltsMock', { id: data.mockInProgress.id })} fullWidth />
        </Card>
      ) : (
        <>
          <Card style={styles.mockCard}>
            <Text style={styles.mockTitle}>Short mock test</Text>
            <Text style={styles.mockText}>Reading, Writing Task 2 and Speaking Part 2. About 1 hour 10 minutes.</Text>
            <Button title="Start short mock" onPress={() => beginMock('short')} loading={busy === 'short'} disabled={!!busy} fullWidth />
          </Card>
          <Card style={styles.mockCard}>
            <Text style={styles.mockTitle}>Full mock test</Text>
            <Text style={styles.mockText}>Reading, Writing Tasks 1 and 2, and Speaking Parts 1 to 3. About 1 hour 45 minutes.</Text>
            <Button title="Start full mock" variant="outline" onPress={() => beginMock('full')} loading={busy === 'full'} disabled={!!busy} fullWidth />
          </Card>
        </>
      )}

      {data.mocks.length > 0 && (
        <>
          <SectionLabel>Your mock tests</SectionLabel>
          {data.mocks.map((m) => (
            <Card key={m.id} style={styles.item} onPress={() => navigation.navigate('IeltsMock', { id: m.id })}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{m.type === 'full' ? 'Full mock test' : 'Short mock test'}</Text>
                <Text style={styles.itemMeta}>{new Date(m.date).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.bandBadge, { borderColor: bandColor(m.overall) }]}>
                <Text style={[styles.bandBadgeText, { color: bandColor(m.overall) }]}>{formatBand(m.overall)}</Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: SPACING.base },
  circle: { width: 128, height: 128, borderRadius: 64, borderWidth: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card },
  circleText: { fontSize: 44, fontWeight: '800' },
  heroTitle: { ...FONTS.h4, marginTop: SPACING.md },
  heroMeta: { ...FONTS.small, marginTop: 2 },
  disclaimer: { ...FONTS.tiny, marginTop: SPACING.xs, textAlign: 'center' },
  empty: { ...FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', padding: SPACING.base },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { marginRight: 0 },
  skill: { padding: SPACING.base },
  skillHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  skillName: { ...FONTS.h4, flex: 1 },
  skillCount: { ...FONTS.tiny },
  skillStats: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.lg },
  skillStat: { alignItems: 'center' },
  skillValue: { ...FONTS.h3 },
  skillLabel: { ...FONTS.tiny },
  trend: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginLeft: 'auto', height: 40 },
  bar: { width: 8, borderRadius: 2 },
  noResults: { ...FONTS.small, color: COLORS.textSecondary },
  practise: { marginTop: SPACING.md },
  focus: { padding: SPACING.base },
  focusText: { ...FONTS.regular, lineHeight: 24 },
  mockCard: { padding: SPACING.base },
  mockTitle: { ...FONTS.h4, marginBottom: SPACING.xs },
  mockText: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginBottom: SPACING.sm },
  itemText: { flex: 1, paddingRight: SPACING.sm },
  itemTitle: { ...FONTS.regular, fontWeight: '600' },
  itemMeta: { ...FONTS.tiny, marginTop: 2 },
  bandBadge: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  bandBadgeText: { ...FONTS.regular, fontWeight: '700' },
});

export default IeltsProgressScreen;
