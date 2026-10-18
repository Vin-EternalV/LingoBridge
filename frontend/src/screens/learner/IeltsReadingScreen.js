import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { startReading, getReadingStats, getReadingTests } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { formatBand, bandColor } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const Stat = ({ label, value, color }) => (
  <View style={styles.stat}>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const IeltsReadingScreen = ({ navigation }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getReadingStats(), getReadingTests()])
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
      const test = await startReading({ topic: topic.trim() });
      navigation.navigate('IeltsReadingTask', { test });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create a reading test. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="IELTS Reading">
      <Text style={styles.intro}>
        Read one passage and answer 13 questions in IELTS style: matching headings, True / False / Not Given, multiple
        choice and completion. You have 20 minutes. Your answers are marked instantly, and every answer comes with an
        explanation and the sentence in the passage that proves it.
      </Text>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          The passage and questions are written by AI, so now and then a question may be unclear. The band is an
          estimate scaled to a 40-question test, not an official IELTS result.
        </Text>
      </View>

      {stats?.count > 0 && (
        <View style={styles.statsRow}>
          <Stat label="Latest" value={formatBand(stats.latest)} color={bandColor(stats.latest)} />
          <Stat label="Average" value={stats.average.toFixed(1)} />
          <Stat label="Best" value={formatBand(stats.best)} color={bandColor(stats.best)} />
          <Stat label="Tests" value={String(stats.count)} />
        </View>
      )}

      <View style={styles.topicBox}>
        <Input
          label="Topic"
          optional
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g. space, health, architecture"
          maxLength={80}
        />
      </View>

      <StatusMessage type="error" message={error} />
      <Button title={loading ? 'Writing your passage...' : 'Start a reading test'} onPress={start} loading={loading} fullWidth />
      {loading && (
        <Text style={styles.waiting}>Creating a new passage and questions. This can take up to a minute...</Text>
      )}

      {items.length > 0 && (
        <>
          <SectionLabel>Your recent tests</SectionLabel>
          {items.slice(0, 8).map((item) => (
            <Card key={item.id} style={styles.item} onPress={() => navigation.navigate('IeltsReadingResult', { id: item.id })}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title || 'Reading test'}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.score}/{item.total} correct · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.bandBadge, { borderColor: bandColor(item.band) }]}>
                <Text style={[styles.bandBadgeText, { color: bandColor(item.band) }]}>{formatBand(item.band)}</Text>
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
  topicBox: { marginTop: SPACING.md },
  waiting: { ...FONTS.small, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginBottom: SPACING.sm },
  itemText: { flex: 1, paddingRight: SPACING.sm },
  itemTitle: { ...FONTS.regular, fontWeight: '600' },
  itemMeta: { ...FONTS.tiny, marginTop: 2 },
  bandBadge: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  bandBadgeText: { ...FONTS.regular, fontWeight: '700' },
});

export default IeltsReadingScreen;
