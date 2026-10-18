import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusMessage from '../../components/StatusMessage';
import { submitWriting } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { countWords, formatTime, MIN_SCORABLE_WORDS } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const IeltsWritingTaskScreen = ({ route, navigation }) => {
  const t = route.params.task; // { task, module, title, question, bullets, table, minWords, minutes }
  const mockId = route.params.mockId; // set when this essay is a section of a mock test
  const [essay, setEssay] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startedAt = useRef(Date.now());
  const submitted = useRef(false);

  // The clock follows real time (not ticks), so it stays right if the phone sleeps for a moment.
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // Ask before leaving with an unsubmitted essay.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (submitted.current || !essay.trim()) return;
        event.preventDefault();
        confirmAction('Leave this task?', 'Your essay has not been submitted and will be lost.', {
          confirmText: 'Leave',
          destructive: true,
        }).then((ok) => {
          if (ok) navigation.dispatch(event.data.action);
        });
      }),
    [navigation, essay]
  );

  const limit = t.minutes * 60;
  const left = limit - elapsed;
  const words = countWords(essay);
  const enough = words >= t.minWords;
  const criterionName = t.task === 'task1' ? 'Task Achievement' : 'Task Response';

  const submit = async () => {
    if (submitting) return;
    if (words < MIN_SCORABLE_WORDS) {
      setError(`Write at least ${MIN_SCORABLE_WORDS} words so your essay can be marked.`);
      return;
    }
    if (!enough) {
      const ok = await confirmAction(
        'Under the word limit',
        `Your essay has ${words} words and the minimum is ${t.minWords}. In IELTS this lowers your ${criterionName} score. Submit anyway?`,
        { confirmText: 'Submit anyway' }
      );
      if (!ok) return;
    }

    setSubmitting(true);
    setError('');
    try {
      const data = await submitWriting({
        task: t.task,
        module: t.module,
        prompt: { title: t.title, question: t.question, bullets: t.bullets, table: t.table },
        essay,
        mockId,
        timeSpentSec: Math.floor((Date.now() - startedAt.current) / 1000),
      });
      submitted.current = true;
      navigation.replace('IeltsWritingResult', { submission: data, mockId });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not mark your essay. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <Screen title={t.task === 'task1' ? 'Writing Task 1' : 'Writing Task 2'}>
      <View style={styles.timerRow}>
        <View style={[styles.timer, left <= 300 && styles.timerLow]}>
          <Text style={[styles.timerText, left <= 300 && { color: COLORS.error }]}>
            {left > 0 ? formatTime(left) : "Time's up"}
          </Text>
        </View>
        <Text style={styles.timerHint}>
          {left > 0 ? `Suggested time: ${t.minutes} minutes` : 'You can keep writing and still submit.'}
        </Text>
      </View>

      <Card>
        <Text style={styles.taskTitle}>{t.title}</Text>
        <Text style={styles.question}>{t.question}</Text>

        {t.table && t.table.headers?.length > 0 && (
          <View style={styles.tableBox}>
            {!!t.table.caption && <Text style={styles.caption}>{t.table.caption}</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={[styles.row, styles.headRow]}>
                  {t.table.headers.map((h, i) => (
                    <Text key={i} style={[styles.cell, styles.headCell]}>
                      {h}
                    </Text>
                  ))}
                </View>
                {t.table.rows.map((row, r) => (
                  <View key={r} style={styles.row}>
                    {t.table.headers.map((_, c) => (
                      <Text key={c} style={styles.cell}>
                        {row[c] ?? ''}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {t.bullets?.length > 0 && (
          <View style={styles.bullets}>
            <Text style={styles.bulletsIntro}>In your letter:</Text>
            {t.bullets.map((b, i) => (
              <Text key={i} style={styles.bullet}>
                • {b}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.requirement}>Write at least {t.minWords} words.</Text>
      </Card>

      <TextInput
        style={styles.essay}
        value={essay}
        onChangeText={setEssay}
        placeholder="Start writing your answer here..."
        placeholderTextColor={COLORS.textLight}
        multiline
        maxLength={8000}
        textAlignVertical="top"
        autoCorrect={false}
        spellCheck={false}
      />
      <View style={styles.counterRow}>
        <Text style={[styles.counter, { color: enough ? COLORS.success : COLORS.warning }]}>
          {words} {words === 1 ? 'word' : 'words'}
        </Text>
        <Text style={styles.counterHint}>{enough ? 'Minimum reached' : `${t.minWords - words} more to reach the minimum`}</Text>
      </View>

      <StatusMessage type="error" message={error} />
      {submitting && <Text style={styles.waiting}>Marking your essay. This can take up to a minute...</Text>}
      <Button
        title={submitting ? 'Marking...' : 'Submit for marking'}
        onPress={submit}
        loading={submitting}
        disabled={words < 1}
        fullWidth
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.base },
  timer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  timerLow: { backgroundColor: COLORS.errorLight },
  timerText: { ...FONTS.h4, color: COLORS.primary },
  timerHint: { ...FONTS.tiny, flex: 1 },
  taskTitle: { ...FONTS.h4, marginBottom: SPACING.sm },
  question: { ...FONTS.regular, lineHeight: 24 },
  tableBox: { marginTop: SPACING.md },
  caption: { ...FONTS.small, fontWeight: '600', marginBottom: SPACING.xs },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headRow: { backgroundColor: COLORS.primaryLighter },
  cell: { ...FONTS.small, color: COLORS.text, minWidth: 96, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm },
  headCell: { fontWeight: '700' },
  bullets: { marginTop: SPACING.md },
  bulletsIntro: { ...FONTS.regular, fontWeight: '600', marginBottom: SPACING.xs },
  bullet: { ...FONTS.regular, lineHeight: 24, marginLeft: SPACING.sm },
  requirement: { ...FONTS.small, color: COLORS.textSecondary, marginTop: SPACING.md },
  essay: {
    ...FONTS.regular,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 300,
    lineHeight: 24,
    ...Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0, resize: 'vertical' } }),
  },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs, marginBottom: SPACING.base },
  counter: { ...FONTS.small, fontWeight: '700' },
  counterHint: { ...FONTS.tiny },
  waiting: { ...FONTS.small, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.sm },
});

export default IeltsWritingTaskScreen;
