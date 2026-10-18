import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { getSpeakingSet, getSpeakingStats, getSpeakingSubmissions } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { formatBand, bandColor } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const PARTS = {
  part1: { label: 'Part 1', detail: '4 short questions' },
  part2: { label: 'Part 2', detail: 'Cue card · 1 min prep + 2 min talk' },
  part3: { label: 'Part 3', detail: '4 discussion questions' },
};

const Stat = ({ label, value, color }) => (
  <View style={styles.stat}>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const IeltsSpeakingScreen = ({ navigation }) => {
  const [part, setPart] = useState('part1');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getSpeakingStats(), getSpeakingSubmissions()])
        .then(([s, list]) => {
          if (!active) return;
          setStats(s);
          setItems(list);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  const start = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await getSpeakingSet({ part, topic: topic.trim() });
      navigation.navigate('IeltsSpeakingTask', { set: data });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the questions. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="IELTS Speaking">
      <Text style={styles.intro}>
        Practise the three parts of the IELTS Speaking test. Answer each question, and the AI marks your answers with an
        estimated band score and a model answer to compare with.
      </Text>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Your answers are marked from your words. Pronunciation, speed and pauses are not scored, and results are
          estimates, not official IELTS scores.
        </Text>
      </View>

      {stats?.count > 0 && (
        <View style={styles.statsRow}>
          <Stat label="Latest" value={formatBand(stats.latest)} color={bandColor(stats.latest)} />
          <Stat label="Average" value={stats.average.toFixed(1)} />
          <Stat label="Best" value={formatBand(stats.best)} color={bandColor(stats.best)} />
          <Stat label="Sessions" value={String(stats.count)} />
        </View>
      )}

      <SectionLabel>Choose a part</SectionLabel>
      <View style={styles.chipRow}>
        {Object.entries(PARTS).map(([key, info]) => (
          <Chip key={key} label={`${info.label} · ${info.detail}`} selected={part === key} onPress={() => setPart(key)} style={styles.chip} />
        ))}
      </View>

      <View style={styles.topicBox}>
        <Input
          label="Topic"
          optional
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g. hometown, work, technology"
          maxLength={80}
        />
      </View>

      <StatusMessage type="error" message={error} />
      <Button title={loading ? 'Preparing your questions...' : 'Start speaking practice'} onPress={start} loading={loading} fullWidth />

      {items.length > 0 && (
        <>
          <SectionLabel>Your recent sessions</SectionLabel>
          {items.slice(0, 8).map((item) => (
            <Card key={item.id} style={styles.item} onPress={() => navigation.navigate('IeltsSpeakingResult', { id: item.id })}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title || item.partLabel}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.partLabel} · {item.totalWords} words · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.bandBadge, { borderColor: bandColor(item.overall) }]}>
                <Text style={[styles.bandBadgeText, { color: bandColor(item.overall) }]}>{formatBand(item.overall)}</Text>
              </View>
            </Card>
          ))}
        </>
      )}
      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.base }} />}
    </Screen>
  );
};

const styles = StyleSheet.create({
  intro: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },
  notice: { backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.base },
  noticeText: { ...FONTS.tiny, color: COLORS.warningText },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  stat: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statValue: { ...FONTS.h3 },
  statLabel: { ...FONTS.tiny, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  chip: { marginRight: 0 },
  topicBox: { marginTop: SPACING.md },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginBottom: SPACING.sm },
  itemText: { flex: 1, paddingRight: SPACING.sm },
  itemTitle: { ...FONTS.regular, fontWeight: '600' },
  itemMeta: { ...FONTS.tiny, marginTop: 2 },
  bandBadge: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  bandBadgeText: { ...FONTS.regular, fontWeight: '700' },
});

export default IeltsSpeakingScreen;
