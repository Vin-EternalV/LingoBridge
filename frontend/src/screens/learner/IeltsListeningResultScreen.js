import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionLabel from '../../components/SectionLabel';
import StatusMessage from '../../components/StatusMessage';
import { getListeningTest, deleteListeningTest } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { formatBand, bandColor, formatTime } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const IeltsListeningResultScreen = ({ route, navigation }) => {
  const { result: passed, id, mockId } = route.params || {};
  const [result, setResult] = useState(passed || null);
  const [error, setError] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (result || !id) return;
    getListeningTest(id).then((data) => {
      if (data.status === 'submitted') setResult(data.result);
      else navigation.replace('IeltsListeningTask', { test: data.test });
    }).catch((err) => setError(getErrorMessage(err, 'Could not load this test.')));
  }, [id, result, navigation]);

  const remove = async () => {
    const confirmed = await confirmAction('Delete this test?', 'The test and its marking will be removed from your history.', { confirmText: 'Delete', destructive: true });
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteListeningTest(result.id);
      navigation.navigate('IeltsListening');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete this test.'));
      setDeleting(false);
    }
  };

  if (!result) return <Screen title="Your result"><StatusMessage type="error" message={error} />{!error && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />}</Screen>;
  const color = bandColor(result.band);

  return (
    <Screen title="Listening result">
      <View style={styles.hero}>
        <View style={[styles.circle, { borderColor: color }]}><Text style={[styles.circleText, { color }]}>{formatBand(result.band)}</Text></View>
        <Text style={styles.heroTitle}>{result.score} of {result.total} correct</Text>
        <Text style={styles.heroMeta}>Estimated listening band{result.timeSpentSec ? ` · ${formatTime(result.timeSpentSec)}` : ''}</Text>
        <Text style={styles.disclaimer}>An AI-generated practice estimate, not an official IELTS result.</Text>
      </View>
      <SectionLabel hint="Review the correct answer and explanation for each question.">Question by question</SectionLabel>
      {(result.review || []).map((q, index) => (
        <Card key={index} style={styles.qa}>
          <View style={styles.qHead}>
            <Ionicons name={q.correct ? 'checkmark-circle' : 'close-circle'} size={22} color={q.correct ? COLORS.success : COLORS.error} />
            <Text style={styles.question}><Text style={styles.number}>{index + 1}. </Text>{q.question}</Text>
          </View>
          <Text style={styles.line}><Text style={styles.tag}>Your answer: </Text><Text style={{ color: q.correct ? COLORS.success : COLORS.error, fontWeight: '600' }}>{q.yourAnswer || 'No answer'}</Text></Text>
          {!q.correct && <Text style={styles.line}><Text style={styles.tag}>Correct answer: </Text><Text style={styles.correct}>{q.correctAnswer}</Text></Text>}
          {!!q.explanation && <Text style={styles.explanation}>{q.explanation}</Text>}
          {!!q.evidence && <View style={styles.evidence}><Text style={styles.evidenceTag}>From the recording script</Text><Text style={styles.evidenceText}>{q.evidence}</Text></View>}
        </Card>
      ))}
      <Button title={showTranscript ? 'Hide transcript' : 'Show transcript'} variant="outline" onPress={() => setShowTranscript((shown) => !shown)} fullWidth style={styles.gap} />
      {showTranscript && <Card>{(result.transcript || []).map((turn, i) => <Text key={i} style={styles.transcript}><Text style={styles.speaker}>Speaker {turn.speaker}: </Text>{turn.text}</Text>)}</Card>}
      <StatusMessage type="error" message={error} />
      {mockId ? <Button title="Continue mock test" onPress={() => navigation.navigate('IeltsMock', { id: mockId })} fullWidth /> : <>
        <Button title="Try another listening test" onPress={() => navigation.navigate('IeltsListening')} fullWidth style={styles.gap} />
        <Button title="Delete this test" variant="text" onPress={remove} loading={deleting} fullWidth />
      </>}
    </Screen>
  );
};

const styles = {
  hero: { alignItems: 'center', marginBottom: SPACING.base },
  circle: { width: 128, height: 128, borderRadius: 64, borderWidth: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card },
  circleText: { fontSize: 44, fontWeight: '800' },
  heroTitle: { ...FONTS.h4, marginTop: SPACING.md },
  heroMeta: { ...FONTS.small, marginTop: 2 },
  disclaimer: { ...FONTS.tiny, marginTop: SPACING.xs, textAlign: 'center' },
  qa: { padding: SPACING.base },
  qHead: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  question: { ...FONTS.regular, lineHeight: 24, flex: 1 },
  number: { fontWeight: '800', color: COLORS.primary },
  line: { ...FONTS.regular, lineHeight: 24 },
  tag: { ...FONTS.small, fontWeight: '700', color: COLORS.textSecondary },
  correct: { color: COLORS.success, fontWeight: '600' },
  explanation: { ...FONTS.small, color: COLORS.textSecondary, lineHeight: 20, marginTop: SPACING.sm },
  evidence: { backgroundColor: COLORS.primaryLighter, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  evidenceTag: { ...FONTS.tiny, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  evidenceText: { ...FONTS.small, lineHeight: 20, fontStyle: 'italic' },
  transcript: { ...FONTS.regular, lineHeight: 24, marginBottom: SPACING.md },
  speaker: { fontWeight: '700', color: COLORS.primary },
  gap: { marginBottom: SPACING.sm },
};

export default IeltsListeningResultScreen;
