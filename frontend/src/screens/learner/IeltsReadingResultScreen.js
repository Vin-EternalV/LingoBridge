import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { getReadingTest, deleteReadingTest } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { formatBand, bandColor, formatTime } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const IeltsReadingResultScreen = ({ route, navigation }) => {
  const { result: passed, id, mockId } = route.params || {};
  const [result, setResult] = useState(passed || null);
  const [error, setError] = useState('');
  const [showPassage, setShowPassage] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (result || !id) return;
    getReadingTest(id)
      .then((data) => {
        if (data.status === 'submitted') setResult(data.result);
        else navigation.replace('IeltsReadingTask', { test: data.test }); // an unfinished test: carry on
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load this test.')));
  }, [id, result, navigation]);

  const remove = async () => {
    const ok = await confirmAction('Delete this test?', 'The test and its marking will be removed from your history.', {
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteReadingTest(result.id);
      navigation.navigate('IeltsReading');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete this test.'));
      setDeleting(false);
    }
  };

  if (!result) {
    return (
      <Screen title="Your result">
        <StatusMessage type="error" message={error} />
        {!error && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />}
      </Screen>
    );
  }

  const color = bandColor(result.band);

  return (
    <Screen title="Your result">
      <View style={styles.hero}>
        <View style={[styles.circle, { borderColor: color }]}>
          <Text style={[styles.circleText, { color }]}>{formatBand(result.band)}</Text>
        </View>
        <Text style={styles.heroTitle}>
          {result.score} of {result.total} correct
        </Text>
        <Text style={styles.heroMeta}>
          Estimated band{result.timeSpentSec ? ` · ${formatTime(result.timeSpentSec)}` : ''}
        </Text>
        <Text style={styles.disclaimer}>Scaled to a 40-question test. An estimate for practice, not an official IELTS result.</Text>
      </View>

      <SectionLabel hint="Green is correct, red needs another look.">Question by question</SectionLabel>
      {result.review.map((q, i) => (
        <Card key={i} style={styles.qa}>
          <View style={styles.qHead}>
            <Ionicons name={q.correct ? 'checkmark-circle' : 'close-circle'} size={22} color={q.correct ? COLORS.success : COLORS.error} />
            <Text style={styles.qText}>
              <Text style={styles.qNumber}>{i + 1}. </Text>
              {q.question}
            </Text>
          </View>
          <Text style={styles.line}>
            <Text style={styles.tag}>Your answer: </Text>
            <Text style={{ color: q.correct ? COLORS.success : COLORS.error, fontWeight: '600' }}>{q.yourAnswer || 'No answer'}</Text>
          </Text>
          {!q.correct && (
            <Text style={styles.line}>
              <Text style={styles.tag}>Correct answer: </Text>
              <Text style={{ color: COLORS.success, fontWeight: '600' }}>{q.correctAnswer}</Text>
            </Text>
          )}
          {!!q.explanation && <Text style={styles.explanation}>{q.explanation}</Text>}
          {!!q.evidence && (
            <View style={styles.evidence}>
              <Text style={styles.evidenceTag}>From the passage{q.paragraph ? ` (paragraph ${q.paragraph})` : ''}</Text>
              <Text style={styles.evidenceText}>{q.evidence}</Text>
            </View>
          )}
        </Card>
      ))}

      <Button
        title={showPassage ? 'Hide the passage' : 'Show the passage'}
        variant="outline"
        onPress={() => setShowPassage((v) => !v)}
        fullWidth
        style={styles.gap}
      />
      {showPassage && (
        <Card>
          <Text style={styles.passageTitle}>{result.title}</Text>
          {result.paragraphs.map((p) => (
            <View key={p.label} style={styles.paragraph}>
              <Text style={styles.paragraphLabel}>{p.label}</Text>
              <Text style={styles.paragraphText}>{p.text}</Text>
            </View>
          ))}
        </Card>
      )}

      <StatusMessage type="error" message={error} />
      {mockId ? (
        <Button title="Continue mock test" onPress={() => navigation.navigate('IeltsMock', { id: mockId })} fullWidth />
      ) : (
        <>
          <Button title="Try another passage" onPress={() => navigation.navigate('IeltsReading')} fullWidth style={styles.gap} />
          <Button title="Delete this test" variant="text" onPress={remove} loading={deleting} fullWidth />
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
  qa: { padding: SPACING.base },
  qHead: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  qText: { ...FONTS.regular, lineHeight: 24, flex: 1 },
  qNumber: { fontWeight: '800', color: COLORS.primary },
  line: { ...FONTS.regular, lineHeight: 24 },
  tag: { ...FONTS.small, fontWeight: '700', color: COLORS.textSecondary },
  explanation: { ...FONTS.small, color: COLORS.textSecondary, lineHeight: 20, marginTop: SPACING.sm },
  evidence: { backgroundColor: COLORS.primaryLighter, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  evidenceTag: { ...FONTS.tiny, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  evidenceText: { ...FONTS.small, lineHeight: 20, fontStyle: 'italic' },
  passageTitle: { ...FONTS.h3, marginBottom: SPACING.md },
  paragraph: { flexDirection: 'row', marginBottom: SPACING.md },
  paragraphLabel: { ...FONTS.regular, fontWeight: '800', color: COLORS.primary, width: 24 },
  paragraphText: { ...FONTS.regular, lineHeight: 26, flex: 1 },
  gap: { marginBottom: SPACING.sm },
});

export default IeltsReadingResultScreen;
