import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusMessage from '../../components/StatusMessage';
import SpeakButton from '../../components/SpeakButton';
import DictationButton from '../../components/DictationButton';
import { submitSpeaking } from '../../api/ielts';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { countWords, formatTime } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const MIN_ANSWER_WORDS = 3;

// Suggested length for each answer, shown as a hint under the box.
const HINTS = {
  part1: 'Aim for 2 to 3 sentences (about 20 to 40 words).',
  part2: 'Aim for 1 to 2 minutes of speech (about 150 to 200 words). Cover every point on the card.',
  part3: 'Give an opinion, a reason and an example (about 40 to 70 words).',
};

const IeltsSpeakingTaskScreen = ({ route, navigation }) => {
  const set = route.params.set; // { part, title, questions, bullets, minTotalWords, prepSeconds, speakSeconds }
  const mockId = route.params.mockId; // set when this is a section of a mock test
  const isPart2 = set.part === 'part2';

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => set.questions.map(() => ''));
  const [phase, setPhase] = useState(isPart2 ? 'prep' : 'answer'); // Part 2 starts with one minute to prepare
  const [tick, setTick] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startedAt = useRef(Date.now());
  const phaseStart = useRef(Date.now());
  const submitted = useRef(false);

  // The clocks follow real time, so they stay correct if the phone sleeps for a moment.
  useEffect(() => {
    const id = setInterval(() => setTick(Math.floor((Date.now() - phaseStart.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const startAnswering = () => {
    phaseStart.current = Date.now();
    setTick(0);
    setPhase('answer');
  };

  // When the preparation minute ends, move on to the speaking phase by itself.
  useEffect(() => {
    if (isPart2 && phase === 'prep' && tick >= set.prepSeconds) startAnswering();
  }, [tick, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (submitted.current || !answers.some((a) => a.trim())) return;
        event.preventDefault();
        confirmAction('Leave this session?', 'Your answers have not been submitted and will be lost.', {
          confirmText: 'Leave',
          destructive: true,
        }).then((ok) => {
          if (ok) navigation.dispatch(event.data.action);
        });
      }),
    [navigation, answers]
  );

  const setAnswer = (value) => setAnswers((prev) => prev.map((a, i) => (i === step ? value : a)));
  const appendHeard = (heard) =>
    setAnswers((prev) => prev.map((a, i) => (i === step ? (a ? `${a} ${heard}` : heard) : a)));

  const isLast = step === set.questions.length - 1;
  const words = countWords(answers[step]);
  const totalWords = answers.reduce((sum, a) => sum + countWords(a), 0);
  const prepLeft = set.prepSeconds - tick;
  const speakLeft = set.speakSeconds - tick;

  const next = () => {
    if (words < MIN_ANSWER_WORDS) {
      setError(`Write or say at least ${MIN_ANSWER_WORDS} words before moving on.`);
      return;
    }
    setError('');
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (submitting) return;
    const missing = answers.findIndex((a) => countWords(a) < MIN_ANSWER_WORDS);
    if (missing >= 0) {
      setStep(missing);
      setError(`Answer ${missing + 1} needs at least ${MIN_ANSWER_WORDS} words.`);
      return;
    }
    if (totalWords < set.minTotalWords) {
      setError(`Say a little more: about ${set.minTotalWords} words in total are needed to mark this part. You have ${totalWords}.`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const data = await submitSpeaking({
        part: set.part,
        set: { title: set.title, questions: set.questions, bullets: set.bullets },
        answers,
        mockId,
        timeSpentSec: Math.floor((Date.now() - startedAt.current) / 1000),
      });
      submitted.current = true;
      navigation.replace('IeltsSpeakingResult', { submission: data, mockId });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not mark your answers. Please try again.'));
      setSubmitting(false);
    }
  };

  const title = { part1: 'Speaking Part 1', part2: 'Speaking Part 2', part3: 'Speaking Part 3' }[set.part];

  // ---------- Part 2: one minute to prepare ----------
  if (isPart2 && phase === 'prep') {
    return (
      <Screen title={title}>
        <View style={styles.timerRow}>
          <View style={styles.timer}>
            <Text style={styles.timerText}>{formatTime(Math.max(prepLeft, 0))}</Text>
          </View>
          <Text style={styles.timerHint}>Preparation time. Think about what you will say.</Text>
        </View>
        <Card>
          <Text style={styles.cueTitle}>{set.title}</Text>
          <View style={styles.questionRow}>
            <Text style={styles.question}>{set.questions[0]}</Text>
            <SpeakButton text={set.questions[0]} />
          </View>
          <Text style={styles.bulletsIntro}>You should say:</Text>
          {set.bullets.map((b, i) => (
            <Text key={i} style={styles.bullet}>
              • {b}
            </Text>
          ))}
        </Card>
        <Text style={styles.tip}>You can make notes on paper. When you are ready, start your answer.</Text>
        <Button title="I'm ready, start my answer" onPress={startAnswering} fullWidth />
      </Screen>
    );
  }

  // ---------- Answering ----------
  return (
    <Screen title={title}>
      <View style={styles.timerRow}>
        {isPart2 ? (
          <View style={[styles.timer, speakLeft <= 30 && styles.timerLow]}>
            <Text style={[styles.timerText, speakLeft <= 30 && { color: COLORS.error }]}>
              {speakLeft > 0 ? formatTime(speakLeft) : "Time's up"}
            </Text>
          </View>
        ) : (
          <View style={styles.timer}>
            <Text style={styles.timerText}>
              {step + 1} / {set.questions.length}
            </Text>
          </View>
        )}
        <Text style={styles.timerHint}>
          {isPart2 ? 'Talk for up to 2 minutes. You can keep going after the timer.' : set.title}
        </Text>
      </View>

      <Card>
        {isPart2 && <Text style={styles.cueTitle}>{set.title}</Text>}
        <View style={styles.questionRow}>
          <Text style={styles.question}>{set.questions[step]}</Text>
          <SpeakButton text={set.questions[step]} />
        </View>
        {isPart2 && (
          <View style={styles.bulletsBox}>
            <Text style={styles.bulletsIntro}>You should say:</Text>
            {set.bullets.map((b, i) => (
              <Text key={i} style={styles.bullet}>
                • {b}
              </Text>
            ))}
          </View>
        )}
      </Card>

      <DictationButton key={step} onText={appendHeard} />
      <TextInput
        style={[styles.answer, isPart2 && { minHeight: 240 }]}
        value={answers[step]}
        onChangeText={setAnswer}
        placeholder="Type your answer, or speak it using the microphone..."
        placeholderTextColor={COLORS.textLight}
        multiline
        maxLength={3000}
        textAlignVertical="top"
        autoCorrect={false}
        spellCheck={false}
      />
      <View style={styles.counterRow}>
        <Text style={[styles.counter, { color: words >= MIN_ANSWER_WORDS ? COLORS.success : COLORS.warning }]}>
          {words} {words === 1 ? 'word' : 'words'}
        </Text>
        <Text style={styles.counterHint}>{HINTS[set.part]}</Text>
      </View>
      {Platform.OS !== 'web' && (
        <Text style={styles.tip}>Tip: tap the microphone on your keyboard to speak your answer instead of typing.</Text>
      )}

      <StatusMessage type="error" message={error} />
      {submitting && <Text style={styles.waiting}>Marking your answers. This can take up to a minute...</Text>}

      <View style={styles.navRow}>
        {step > 0 && (
          <Button
            title="Back"
            variant="outline"
            onPress={() => {
              setError('');
              setStep((s) => s - 1);
            }}
            style={styles.navButton}
          />
        )}
        {isLast ? (
          <Button
            title={submitting ? 'Marking...' : 'Submit for marking'}
            onPress={submit}
            loading={submitting}
            style={styles.navButton}
          />
        ) : (
          <Button title="Next question" onPress={next} style={styles.navButton} />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.base },
  timer: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight },
  timerLow: { backgroundColor: COLORS.errorLight },
  timerText: { ...FONTS.h4, color: COLORS.primary },
  timerHint: { ...FONTS.tiny, flex: 1 },
  cueTitle: { ...FONTS.h4, marginBottom: SPACING.sm },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  question: { ...FONTS.regular, fontWeight: '600', lineHeight: 24, flex: 1 },
  bulletsBox: { marginTop: SPACING.md },
  bulletsIntro: { ...FONTS.regular, fontWeight: '600', marginTop: SPACING.md, marginBottom: SPACING.xs },
  bullet: { ...FONTS.regular, lineHeight: 24, marginLeft: SPACING.sm },
  tip: { ...FONTS.tiny, marginVertical: SPACING.sm },
  answer: {
    ...FONTS.regular,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 140,
    lineHeight: 24,
    marginTop: SPACING.sm,
    ...Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0, resize: 'vertical' } }),
  },
  counterRow: { marginTop: SPACING.xs, marginBottom: SPACING.sm },
  counter: { ...FONTS.small, fontWeight: '700' },
  counterHint: { ...FONTS.tiny, marginTop: 2 },
  waiting: { ...FONTS.small, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.sm },
  navRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  navButton: { flex: 1 },
});

export default IeltsSpeakingTaskScreen;
