import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
import StatusMessage from '../../components/StatusMessage';
import { submitReading } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { formatTime } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const GROUP_HELP = {
  heading: 'Choose the correct heading for each paragraph from the list of headings.',
  tfng: 'Do the statements agree with the information in the passage? Choose TRUE if it agrees, FALSE if it contradicts, or NOT GIVEN if the passage does not say.',
  mcq: 'Choose the correct answer.',
  completion: 'Complete each sentence with NO MORE THAN THREE WORDS from the passage.',
};

const Passage = ({ test }) => (
  <View>
    <Text style={styles.passageTitle}>{test.title}</Text>
    {test.paragraphs.map((p) => (
      <View key={p.label} style={styles.paragraph}>
        <Text style={styles.paragraphLabel}>{p.label}</Text>
        <Text style={styles.paragraphText}>{p.text}</Text>
      </View>
    ))}
  </View>
);

const IeltsReadingTaskScreen = ({ route, navigation }) => {
  const { test, mockId } = route.params; // test: { id, title, paragraphs, headings, questions, minutes, elapsedSec }
  const { width } = useWindowDimensions();
  const sideBySide = width >= 900; // passage on the left, questions on the right, like the real computer test

  const [answers, setAnswers] = useState(() => test.questions.map(() => ''));
  const [elapsed, setElapsed] = useState(test.elapsedSec || 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startedAt = useRef(Date.now() - (test.elapsedSec || 0) * 1000);
  const submitted = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (submitted.current || !answers.some((a) => a.trim())) return;
        event.preventDefault();
        confirmAction('Leave this test?', 'Your answers have not been submitted and will be lost.', {
          confirmText: 'Leave',
          destructive: true,
        }).then((ok) => {
          if (ok) navigation.dispatch(event.data.action);
        });
      }),
    [navigation, answers]
  );

  const left = test.minutes * 60 - elapsed;
  const answered = answers.filter((a) => a.trim()).length;
  const setAnswer = (index, value) => setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));

  const submit = async () => {
    if (submitting) return;
    const blank = test.questions.length - answered;
    if (blank > 0) {
      const ok = await confirmAction(
        'Submit with unanswered questions?',
        `${blank} ${blank === 1 ? 'question has' : 'questions have'} no answer yet. Unanswered questions score zero.`,
        { confirmText: 'Submit anyway' }
      );
      if (!ok) return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await submitReading(test.id, {
        answers,
        timeSpentSec: Math.floor((Date.now() - startedAt.current) / 1000),
      });
      submitted.current = true;
      navigation.replace('IeltsReadingResult', { result, mockId });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit your answers. Please try again.'));
      setSubmitting(false);
    }
  };

  const renderQuestion = (q, number) => {
    const value = answers[q.index];
    return (
      <View key={q.index} style={styles.question}>
        <Text style={styles.qText}>
          <Text style={styles.qNumber}>{number}. </Text>
          {q.question}
        </Text>

        {(q.type === 'tfng' || q.type === 'mcq') &&
          q.options.map((option, i) => {
            const selected = value === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => setAnswer(q.index, selected ? '' : option)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? COLORS.primary : COLORS.textSecondary} />
                <Text style={styles.optionText}>{q.type === 'mcq' ? `${'ABCD'[i]}  ${option}` : option}</Text>
              </TouchableOpacity>
            );
          })}

        {q.type === 'heading' && (
          <Dropdown
            sheetTitle="Choose a heading"
            value={value}
            options={test.headings}
            onChange={(v) => setAnswer(q.index, v)}
            placeholder="Choose a heading"
            searchable={false}
            clearLabel="Clear answer"
          />
        )}

        {q.type === 'completion' && (
          <TextInput
            style={styles.gapInput}
            value={value}
            onChangeText={(v) => setAnswer(q.index, v)}
            placeholder="Your answer (max. 3 words)"
            placeholderTextColor={COLORS.textLight}
            maxLength={60}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
        )}
      </View>
    );
  };

  // Questions come in groups (headings, then T/F/NG, then multiple choice, then completion), numbered continuously.
  const questionsBlock = (
    <View>
      {test.questions.map((q, i) => {
        const isFirstOfGroup = i === 0 || test.questions[i - 1].type !== q.type;
        let groupEnd = i;
        while (groupEnd + 1 < test.questions.length && test.questions[groupEnd + 1].type === q.type) groupEnd += 1;
        return (
          <View key={q.index}>
            {isFirstOfGroup && (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>
                  {groupEnd === i ? `Question ${i + 1}` : `Questions ${i + 1} to ${groupEnd + 1}`}
                </Text>
                <Text style={styles.groupHelp}>{GROUP_HELP[q.type]}</Text>
                {q.type === 'heading' && (
                  <View style={styles.headingList}>
                    <Text style={styles.headingListTitle}>List of headings</Text>
                    {test.headings.map((h, k) => (
                      <Text key={h} style={styles.headingItem}>
                        {['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][k]}.  {h}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
            {renderQuestion(q, i + 1)}
          </View>
        );
      })}
      <StatusMessage type="error" message={error} />
      <Button title={submitting ? 'Marking...' : 'Submit answers'} onPress={submit} loading={submitting} fullWidth />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Reading" showBack />
      <View style={styles.timerBar}>
        <View style={[styles.timer, left <= 300 && styles.timerLow]}>
          <Text style={[styles.timerText, left <= 300 && { color: COLORS.error }]}>{left > 0 ? formatTime(left) : "Time's up"}</Text>
        </View>
        <Text style={styles.timerHint}>
          {answered} of {test.questions.length} answered{left <= 0 ? ' · you can still submit' : ''}
        </Text>
      </View>

      {sideBySide ? (
        <View style={styles.split}>
          <ScrollView style={styles.pane} contentContainerStyle={styles.paneContent}>
            <Passage test={test} />
          </ScrollView>
          <ScrollView style={styles.pane} contentContainerStyle={styles.paneContent} keyboardShouldPersistTaps="handled">
            {questionsBlock}
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.paneContent} keyboardShouldPersistTaps="handled">
          <Card>
            <Passage test={test} />
          </Card>
          {questionsBlock}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timer: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.base, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight },
  timerLow: { backgroundColor: COLORS.errorLight },
  timerText: { ...FONTS.h4, color: COLORS.primary },
  timerHint: { ...FONTS.tiny, flex: 1 },
  split: { flex: 1, flexDirection: 'row' },
  pane: { flex: 1 },
  paneContent: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  passageTitle: { ...FONTS.h3, marginBottom: SPACING.md },
  paragraph: { flexDirection: 'row', marginBottom: SPACING.md },
  paragraphLabel: { ...FONTS.regular, fontWeight: '800', color: COLORS.primary, width: 24 },
  paragraphText: { ...FONTS.regular, lineHeight: 26, flex: 1 },
  group: { marginTop: SPACING.base, marginBottom: SPACING.sm },
  groupTitle: { ...FONTS.h4 },
  groupHelp: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2, lineHeight: 20 },
  headingList: { backgroundColor: COLORS.primaryLighter, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  headingListTitle: { ...FONTS.small, fontWeight: '700', marginBottom: SPACING.xs },
  headingItem: { ...FONTS.small, lineHeight: 22 },
  question: { marginBottom: SPACING.base },
  qText: { ...FONTS.regular, lineHeight: 24, marginBottom: SPACING.sm },
  qNumber: { fontWeight: '800', color: COLORS.primary },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.xs,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optionText: { ...FONTS.regular, flex: 1 },
  gapInput: {
    ...FONTS.regular,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } }),
  },
});

export default IeltsReadingTaskScreen;
