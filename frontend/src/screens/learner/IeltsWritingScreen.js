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
import { getWritingPrompt, getWritingStats, getWritingSubmissions } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { formatBand, bandColor } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const TASKS = {
  task1: { label: 'Task 1', detail: '150+ words · 20 min' },
  task2: { label: 'Task 2', detail: '250+ words · 40 min' },
};

const Stat = ({ label, value, color }) => (
  <View style={styles.stat}>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const IeltsWritingScreen = ({ navigation }) => {
  const [task, setTask] = useState('task2');
  const [module, setModule] = useState('academic');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);

  // Refresh the numbers and the list every time the learner comes back to this screen.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getWritingStats(), getWritingSubmissions()])
        .then(([s, list]) => {
          if (!active) return;
          setStats(s);
          setItems(list);
        })
        .catch(() => {}); // the history is a bonus; the screen still works without it
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
      const data = await getWritingPrompt({ task, module, topic: topic.trim() });
      navigation.navigate('IeltsWritingTask', { task: data });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create a task. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="IELTS Writing">
      <Text style={styles.intro}>
        Practise IELTS-style writing. You get an original task, write your answer, and the AI marks it on the four
        IELTS criteria with an estimated band score.
      </Text>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Scores are estimates to guide your practice. They are not official IELTS results.
        </Text>
      </View>

      {stats?.count > 0 && (
        <View style={styles.statsRow}>
          <Stat label="Latest" value={formatBand(stats.latest)} color={bandColor(stats.latest)} />
          <Stat label="Average" value={stats.average.toFixed(1)} />
          <Stat label="Best" value={formatBand(stats.best)} color={bandColor(stats.best)} />
          <Stat label="Essays" value={String(stats.count)} />
        </View>
      )}

      <SectionLabel>Choose a task</SectionLabel>
      <View style={styles.chipRow}>
        {Object.entries(TASKS).map(([key, info]) => (
          <Chip key={key} label={`${info.label} · ${info.detail}`} selected={task === key} onPress={() => setTask(key)} style={styles.chip} />
        ))}
      </View>

      {task === 'task1' && (
        <>
          <SectionLabel hint="Academic describes a table of data. General Training is a letter.">Test type</SectionLabel>
          <View style={styles.chipRow}>
            <Chip label="Academic" selected={module === 'academic'} onPress={() => setModule('academic')} style={styles.chip} />
            <Chip label="General Training" selected={module === 'general'} onPress={() => setModule('general')} style={styles.chip} />
          </View>
        </>
      )}

      <View style={styles.topicBox}>
        <Input
          label="Topic"
          optional
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g. technology, environment, education"
          maxLength={80}
        />
      </View>

      <StatusMessage type="error" message={error} />
      <Button title={loading ? 'Creating your task...' : 'Get a writing task'} onPress={start} loading={loading} fullWidth />

      {items.length > 0 && (
        <>
          <SectionLabel>Your recent essays</SectionLabel>
          {items.slice(0, 8).map((item) => (
            <Card key={item.id} style={styles.item} onPress={() => navigation.navigate('IeltsWritingResult', { id: item.id })}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title || item.taskLabel}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.taskLabel} · {item.wordCount} words · {new Date(item.createdAt).toLocaleDateString()}
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

export default IeltsWritingScreen;
