import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { startListening, getListeningStats, getListeningTests } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { formatBand, bandColor } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const IeltsListeningScreen = ({ navigation }) => {
  const [kind, setKind] = useState('conversation');
  const [topic, setTopic] = useState('');
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([getListeningStats(), getListeningTests()]).then(([nextStats, nextItems]) => {
      if (!active) return;
      setStats(nextStats);
      setItems(nextItems);
    }).catch(() => {});
    return () => { active = false; };
  }, []));

  const start = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const test = await startListening({ kind, topic: topic.trim() });
      navigation.navigate('IeltsListeningTask', { test });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create a listening test. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="IELTS Listening">
      <Text style={styles.intro}>Listen to a short conversation or talk, answer IELTS-style questions, and review your answers with explanations.</Text>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>The script and questions are AI-generated. A temporary recording may be made for this test; if it is unavailable, your device reads the script aloud. Scores are estimates for practice.</Text>
      </View>
      {!!stats?.count && (
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={[styles.statValue, { color: bandColor(stats.latest) }]}>{formatBand(stats.latest)}</Text><Text style={styles.statLabel}>Latest</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{stats.average.toFixed(1)}</Text><Text style={styles.statLabel}>Average</Text></View>
          <View style={styles.stat}><Text style={[styles.statValue, { color: bandColor(stats.best) }]}>{formatBand(stats.best)}</Text><Text style={styles.statLabel}>Best</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{stats.count}</Text><Text style={styles.statLabel}>Tests</Text></View>
        </View>
      )}
      <Dropdown label="Recording type" value={kind} options={['conversation', 'talk']} onChange={setKind} searchable={false} />
      <Input label="Topic" optional value={topic} onChangeText={setTopic} placeholder="e.g. university housing, travel" maxLength={80} />
      <StatusMessage type="error" message={error} />
      <Button title={loading ? 'Creating listening test...' : 'Start a listening test'} onPress={start} loading={loading} fullWidth />
      {loading && <Text style={styles.waiting}>Creating the script and questions. This can take up to a minute...</Text>}
      {items.length > 0 && <>
        <SectionLabel>Your recent tests</SectionLabel>
        {items.slice(0, 8).map((item) => (
          <Card key={item.id} style={styles.item} onPress={() => navigation.navigate('IeltsListeningResult', { id: item.id })}>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title || 'Listening test'}</Text>
              <Text style={styles.itemMeta}>{item.score}/{item.total} correct · {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.bandBadge, { borderColor: bandColor(item.band) }]}><Text style={[styles.bandText, { color: bandColor(item.band) }]}>{formatBand(item.band)}</Text></View>
          </Card>
        ))}
      </>}
      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.base }} />}
    </Screen>
  );
};

const styles = {
  intro: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },
  notice: { backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.base },
  noticeText: { ...FONTS.tiny, color: COLORS.warningText },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  stat: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingVertical: SPACING.md, alignItems: 'center' },
  statValue: { ...FONTS.h3 },
  statLabel: { ...FONTS.tiny, marginTop: 2 },
  waiting: { ...FONTS.small, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginBottom: SPACING.sm },
  itemText: { flex: 1, paddingRight: SPACING.sm },
  itemTitle: { ...FONTS.regular, fontWeight: '600' },
  itemMeta: { ...FONTS.tiny, marginTop: 2 },
  bandBadge: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  bandText: { ...FONTS.regular, fontWeight: '700' },
};

export default IeltsListeningScreen;
