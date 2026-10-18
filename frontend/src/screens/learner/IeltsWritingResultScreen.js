import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { getWritingSubmission, deleteWritingSubmission } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { formatBand, bandColor, formatTime } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const IeltsWritingResultScreen = ({ route, navigation }) => {
  const { submission: passed, id, mockId } = route.params || {};
  const [sub, setSub] = useState(passed || null);
  const [error, setError] = useState('');
  const [showEssay, setShowEssay] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Opened from the history list: only the id was passed, so load the full result.
  useEffect(() => {
    if (sub || !id) return;
    getWritingSubmission(id)
      .then(setSub)
      .catch((err) => setError(getErrorMessage(err, 'Could not load this essay.')));
  }, [id, sub]);

  const remove = async () => {
    const ok = await confirmAction('Delete this essay?', 'The essay and its marking will be removed from your history.', {
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteWritingSubmission(sub.id);
      navigation.navigate('IeltsWriting');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete this essay.'));
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
          {sub.taskLabel} · {sub.wordCount} words
          {sub.timeSpentSec ? ` · ${formatTime(sub.timeSpentSec)}` : ''}
        </Text>
        <Text style={styles.disclaimer}>An AI estimate for practice, not an official IELTS result.</Text>
      </View>

      {sub.underLength && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            This essay is under the {sub.minWords}-word minimum, which lowers the {sub.criteria[0].label} score in IELTS.
          </Text>
        </View>
      )}

      <SectionLabel>Your four criteria</SectionLabel>
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

      {sub.corrections.length > 0 && (
        <>
          <SectionLabel hint="Taken straight from your essay.">Corrections</SectionLabel>
          {sub.corrections.map((c, i) => (
            <Card key={i} style={styles.correction}>
              <Text style={styles.original}>{c.original}</Text>
              <Text style={styles.suggestion}>{c.suggestion}</Text>
              <Text style={styles.reason}>{c.reason}</Text>
            </Card>
          ))}
        </>
      )}

      <SectionLabel>The task</SectionLabel>
      <Card>
        <Text style={styles.body}>{sub.prompt?.question}</Text>
      </Card>

      <Button
        title={showEssay ? 'Hide my essay' : 'Show my essay'}
        variant="outline"
        onPress={() => setShowEssay((v) => !v)}
        fullWidth
        style={styles.gap}
      />
      {showEssay && (
        <Card>
          <Text style={styles.essay}>{sub.essay}</Text>
        </Card>
      )}

      <StatusMessage type="error" message={error} />
      {mockId ? (
        <Button title="Continue mock test" onPress={() => navigation.navigate('IeltsMock', { id: mockId })} fullWidth />
      ) : (
        <>
          <Button title="Write another task" onPress={() => navigation.navigate('IeltsWriting')} fullWidth style={styles.gap} />
          <Button title="Delete this essay" variant="text" onPress={remove} loading={deleting} fullWidth />
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
  warn: { backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  warnText: { ...FONTS.small, color: COLORS.warningText },
  criterion: { padding: SPACING.base },
  critHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  critLabel: { ...FONTS.regular, fontWeight: '600', flex: 1, paddingRight: SPACING.sm },
  critBand: { ...FONTS.h3 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginVertical: SPACING.sm, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  comment: { ...FONTS.small, color: COLORS.textSecondary, lineHeight: 20 },
  body: { ...FONTS.regular, lineHeight: 24 },
  listItem: { ...FONTS.regular, lineHeight: 24, marginBottom: SPACING.xs },
  correction: { padding: SPACING.base },
  original: { ...FONTS.regular, color: COLORS.error, textDecorationLine: 'line-through' },
  suggestion: { ...FONTS.regular, color: COLORS.success, fontWeight: '600', marginTop: SPACING.xs },
  reason: { ...FONTS.small, color: COLORS.textSecondary, marginTop: SPACING.xs },
  essay: { ...FONTS.regular, lineHeight: 24 },
  gap: { marginBottom: SPACING.sm },
});

export default IeltsWritingResultScreen;
