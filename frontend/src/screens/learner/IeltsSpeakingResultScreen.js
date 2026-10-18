import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import SpeakButton from '../../components/SpeakButton';
import { getSpeakingSubmission, deleteSpeakingSubmission } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { formatBand, bandColor, formatTime } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const IeltsSpeakingResultScreen = ({ route, navigation }) => {
  const { submission: passed, id, mockId } = route.params || {};
  const [sub, setSub] = useState(passed || null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (sub || !id) return;
    getSpeakingSubmission(id)
      .then(setSub)
      .catch((err) => setError(getErrorMessage(err, 'Could not load this result.')));
  }, [id, sub]);

  const remove = async () => {
    const ok = await confirmAction('Delete this result?', 'The answers and their marking will be removed from your history.', {
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteSpeakingSubmission(sub.id);
      navigation.navigate('IeltsSpeaking');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete this result.'));
      setDeleting(false);
    }
  };

  if (!sub) {
    return (
      <Screen title="Your result">
        <StatusMessage type="error" message={error} />
        {!error && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />}
      </Screen>
    );
  }

  const color = bandColor(sub.overall);

  return (
    <Screen title="Your result">
      <View style={styles.hero}>
        <View style={[styles.circle, { borderColor: color }]}>
          <Text style={[styles.circleText, { color }]}>{formatBand(sub.overall)}</Text>
        </View>
        <Text style={styles.heroTitle}>Estimated overall band</Text>
        <Text style={styles.heroMeta}>
          {sub.partLabel} · {sub.totalWords} words
          {sub.timeSpentSec ? ` · ${formatTime(sub.timeSpentSec)}` : ''}
        </Text>
        <Text style={styles.disclaimer}>An AI estimate for practice, not an official IELTS result.</Text>
      </View>

      <SectionLabel>Your criteria</SectionLabel>
      {sub.criteria.map((c) => (
        <Card key={c.key} style={styles.criterion}>
          <View style={styles.critHead}>
            <Text style={styles.critLabel}>{c.label}</Text>
            <Text style={[styles.critBand, { color: bandColor(c.band) }]}>{formatBand(c.band)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.min(100, (c.band / 9) * 100)}%`, backgroundColor: bandColor(c.band) }]} />
          </View>
          {!!c.comment && <Text style={styles.comment}>{c.comment}</Text>}
        </Card>
      ))}
      <View style={styles.note}>
        <Text style={styles.noteText}>{sub.pronunciationNote}</Text>
      </View>

      {!!sub.summary && (
        <>
          <SectionLabel>Overall impression</SectionLabel>
          <Card>
            <Text style={styles.body}>{sub.summary}</Text>
          </Card>
        </>
      )}

      {sub.strengths.length > 0 && (
        <>
          <SectionLabel>What you did well</SectionLabel>
          <Card>
            {sub.strengths.map((s, i) => (
              <Text key={i} style={styles.listItem}>
                <Text style={{ color: COLORS.success }}>✓ </Text>
                {s}
              </Text>
            ))}
          </Card>
        </>
      )}

      {sub.improvements.length > 0 && (
        <>
          <SectionLabel>How to improve</SectionLabel>
          <Card>
            {sub.improvements.map((s, i) => (
              <Text key={i} style={styles.listItem}>
                <Text style={{ color: COLORS.primary }}>→ </Text>
                {s}
              </Text>
            ))}
          </Card>
        </>
      )}

      <SectionLabel hint="Compare your answer with a model answer. Tap the speaker to listen to it.">Question by question</SectionLabel>
      {sub.answers.map((a, i) => (
        <Card key={i} style={styles.qa}>
          <Text style={styles.qLabel}>
            {sub.answers.length > 1 ? `Question ${i + 1}` : 'Cue card'}
          </Text>
          <Text style={styles.question}>{a.question}</Text>
          <Text style={styles.sectionTag}>Your answer</Text>
          <Text style={styles.body}>{a.answer}</Text>
          {!!a.comment && (
            <>
              <Text style={styles.sectionTag}>Feedback</Text>
              <Text style={styles.comment}>{a.comment}</Text>
            </>
          )}
          {!!a.sampleAnswer && (
            <View style={styles.sample}>
              <View style={styles.sampleHead}>
                <Text style={styles.sampleTitle}>Model answer</Text>
                <SpeakButton text={a.sampleAnswer} slow />
              </View>
              <Text style={styles.body}>{a.sampleAnswer}</Text>
            </View>
          )}
        </Card>
      ))}

      {sub.corrections.length > 0 && (
        <>
          <SectionLabel hint="Taken straight from your answers.">Corrections</SectionLabel>
          {sub.corrections.map((c, i) => (
            <Card key={i} style={styles.correction}>
              <Text style={styles.original}>{c.original}</Text>
              <Text style={styles.suggestion}>{c.suggestion}</Text>
              <Text style={styles.reason}>{c.reason}</Text>
            </Card>
          ))}
        </>
      )}

      <StatusMessage type="error" message={error} />
      {mockId ? (
        <Button title="Continue mock test" onPress={() => navigation.navigate('IeltsMock', { id: mockId })} fullWidth />
      ) : (
        <>
          <Button title="Practise again" onPress={() => navigation.navigate('IeltsSpeaking')} fullWidth style={styles.gap} />
          <Button title="Delete this result" variant="text" onPress={remove} loading={deleting} fullWidth />
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
  criterion: { padding: SPACING.base },
  critHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  critLabel: { ...FONTS.regular, fontWeight: '600', flex: 1, paddingRight: SPACING.sm },
  critBand: { ...FONTS.h3 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginVertical: SPACING.sm, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  comment: { ...FONTS.small, color: COLORS.textSecondary, lineHeight: 20 },
  note: { backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  noteText: { ...FONTS.tiny, color: COLORS.warningText },
  body: { ...FONTS.regular, lineHeight: 24 },
  listItem: { ...FONTS.regular, lineHeight: 24, marginBottom: SPACING.xs },
  qa: { padding: SPACING.base },
  qLabel: { ...FONTS.tiny, fontWeight: '700', textTransform: 'uppercase' },
  question: { ...FONTS.regular, fontWeight: '600', lineHeight: 24, marginTop: 2 },
  sectionTag: { ...FONTS.tiny, fontWeight: '700', marginTop: SPACING.md, marginBottom: 2, textTransform: 'uppercase' },
  sample: { backgroundColor: COLORS.primaryLighter, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md },
  sampleHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  sampleTitle: { ...FONTS.small, fontWeight: '700', color: COLORS.primary },
  correction: { padding: SPACING.base },
  original: { ...FONTS.regular, color: COLORS.error, textDecorationLine: 'line-through' },
  suggestion: { ...FONTS.regular, color: COLORS.success, fontWeight: '600', marginTop: SPACING.xs },
  reason: { ...FONTS.small, color: COLORS.textSecondary, marginTop: SPACING.xs },
  gap: { marginBottom: SPACING.sm },
});

export default IeltsSpeakingResultScreen;
