import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
import StatusMessage from '../../components/StatusMessage';
import { submitListening, getListeningAudioInfo, resolveAudioUrl } from '../../api/ielts';
import { useScriptPlayer } from '../../utils/scriptPlayer';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { formatTime } from '../../utils/ielts';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const GROUP_HELP = {
  completion: 'Complete the notes. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
  mcq: 'Choose the correct answer.',
  matching: 'Choose the correct answer from the list for each item.',
};

const IeltsListeningTaskScreen = ({ route, navigation }) => {
  const { test, mockId, allowReplay = false } = route.params;
  const canReplay = allowReplay && !mockId; // a mock test always plays once
  const { state, progress, source, play, playFile } = useScriptPlayer(test.turns);

  const [answers, setAnswers] = useState(() => test.questions.map(() => ''));
  const [started, setStarted] = useState(false);
  const [prepLeft, setPrepLeft] = useState(test.prepSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const openedAt = useRef(Date.now());
  const submitted = useRef(false);

  // Server-made audio is created in the background while the learner reads the questions.
  const [audio, setAudio] = useState({ status: test.audioStatus || 'none', url: null });
  const audioRef = useRef(audio);
  const [preparing, setPreparing] = useState(false);
  const updateAudio = (next) => {
    audioRef.current = next;
    setAudio(next);
  };

  // Ask the server every few seconds until the recording is ready (or has failed).
  useEffect(() => {
    if (audioRef.current.status !== 'pending' && audioRef.current.status !== 'ready') return undefined;
    let active = true;
    const poll = async () => {
      for (let i = 0; i < 70 && active; i += 1) {
        try {
          const info = await getListeningAudioInfo(test.id);
          if (!active) return;
          updateAudio({ status: info.status, url: info.path ? resolveAudioUrl(info.path) : null });
          if (info.status !== 'pending') return;
        } catch (e) {
          // try again on the next round
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    };
    poll();
    return () => {
      active = false;
    };
  }, [test.id]);

  // Prefer the server-made recording. If it is not ready in time, or cannot play, the device voice takes over.
  const startPlayback = async () => {
    if (audioRef.current.status === 'pending') {
      setPreparing(true);
      const since = Date.now();
      while (audioRef.current.status === 'pending' && Date.now() - since < 25000) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      setPreparing(false);
    }
    const current = audioRef.current;
    if (current.status === 'ready' && current.url) {
      const result = await playFile(current.url);
      if (result !== false) return; // finished, or stopped because the learner left
    }
    play();
  };

  const replay = () => {
    const current = audioRef.current;
    if (current.status === 'ready' && current.url) {
      playFile(current.url).then((result) => {
        if (result === false) play();
      });
    } else {
      play();
    }
  };

  const begin = () => {
    if (started) return;
    setStarted(true);
    startPlayback();
  };

  // 30 seconds to read the questions, then the recording starts by itself.
  useEffect(() => {
    if (started) return undefined;
    const id = setInterval(() => {
      const left = test.prepSeconds - Math.floor((Date.now() - openedAt.current) / 1000);
      setPrepLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(id);
        begin();
      }
    }, 500);
    return () => clearInterval(id);
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (submitted.current || (!started && !answers.some((a) => a.trim()))) return;
        event.preventDefault();
        confirmAction('Leave this test?', 'Your answers have not been submitted and the recording will stop.', {
          confirmText: 'Leave',
          destructive: true,
        }).then((ok) => {
          if (ok) navigation.dispatch(event.data.action);
        });
      }),
    [navigation, answers, started]
  );

  const answered = answers.filter((a) => a.trim()).length;
  const phase = !started ? 'prep' : state === 'done' ? 'checking' : 'listening';
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
      const result = await submitListening(test.id, {
        answers,
        timeSpentSec: Math.floor((Date.now() - openedAt.current) / 1000),
      });
      submitted.current = true;
      navigation.replace('IeltsListeningResult', { result, mockId });
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

        {q.type === 'mcq' &&
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
                <Text style={styles.optionText}>{`${'ABC'[i]}  ${option}`}</Text>
              </TouchableOpacity>
            );
          })}

        {q.type === 'matching' && (
          <Dropdown
            sheetTitle={test.matchTitle || 'Choose an answer'}
            value={value}
            options={test.matchOptions}
            onChange={(v) => setAnswer(q.index, v)}
            placeholder="Choose an answer"
            searchable={false}
            clearLabel="Clear answer"
          />
        )}

        {q.type === 'completion' && (
          <TextInput
            style={styles.gapInput}
            value={value}
            onChangeText={(v) => setAnswer(q.index, v)}
            placeholder="Your answer"
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Listening" showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.player}>
          <View style={styles.playerHead}>
            <Ionicons name={phase === 'listening' ? 'volume-high' : 'headset'} size={28} color={COLORS.primary} />
            <View style={styles.playerText}>
              {phase === 'prep' && (
                <>
                  <Text style={styles.playerTitle}>Read the questions</Text>
                  <Text style={styles.playerSub}>The recording starts in {formatTime(prepLeft)}.</Text>
                </>
              )}
              {phase === 'listening' && (
                <>
                  <Text style={styles.playerTitle}>{preparing ? 'Getting the recording ready...' : 'Recording is playing'}</Text>
                  <Text style={styles.playerSub}>{canReplay ? 'You can replay it afterwards.' : 'You will hear it only once.'}</Text>
                </>
              )}
              {phase === 'checking' && (
                <>
                  <Text style={styles.playerTitle}>The recording has finished</Text>
                  <Text style={styles.playerSub}>Check your answers, then submit.</Text>
                </>
              )}
            </View>
          </View>
          {phase !== 'prep' && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round((phase === 'checking' ? 1 : progress) * 100)}%` }]} />
            </View>
          )}
          {phase === 'prep' && <Button title="Start the recording now" variant="outline" onPress={begin} fullWidth style={styles.playerButton} />}
          {phase === 'checking' && canReplay && <Button title="Play again" variant="outline" onPress={replay} fullWidth style={styles.playerButton} />}
          {phase !== 'prep' && !preparing && source && (
            <Text style={styles.tip}>Voice: {source === 'file' ? 'recorded audio' : "your device's built-in voice"}</Text>
          )}
          <Text style={styles.tip}>No sound? Turn the volume up, switch off silent mode, or try headphones.</Text>
        </Card>

        <Text style={styles.context}>{test.context}</Text>
        <Text style={styles.progressText}>
          {answered} of {test.questions.length} answered
        </Text>

        {test.questions.map((q, i) => {
          const first = i === 0 || test.questions[i - 1].type !== q.type;
          let last = i;
          while (last + 1 < test.questions.length && test.questions[last + 1].type === q.type) last += 1;
          return (
            <View key={q.index}>
              {first && (
                <View style={styles.group}>
                  <Text style={styles.groupTitle}>{last === i ? `Question ${i + 1}` : `Questions ${i + 1} to ${last + 1}`}</Text>
                  <Text style={styles.groupHelp}>{GROUP_HELP[q.type]}</Text>
                  {q.type === 'matching' && !!test.matchTitle && <Text style={styles.matchTitle}>{test.matchTitle}</Text>}
                  {q.type === 'matching' && (
                    <View style={styles.matchList}>
                      {test.matchOptions.map((o) => (
                        <Text key={o} style={styles.matchItem}>
                          • {o}
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
        {phase !== 'checking' && <Text style={styles.waitHint}>You can submit when the recording has finished.</Text>}
        <Button
          title={submitting ? 'Marking...' : 'Submit answers'}
          onPress={submit}
          loading={submitting}
          disabled={phase !== 'checking'}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxxl, ...Platform.select({ web: { maxWidth: 760, width: '100%', alignSelf: 'center' } }) },
  player: { padding: SPACING.base },
  playerHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  playerText: { flex: 1 },
  playerTitle: { ...FONTS.h4 },
  playerSub: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  track: { height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginTop: SPACING.md, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  playerButton: { marginTop: SPACING.md },
  tip: { ...FONTS.tiny, marginTop: SPACING.sm },
  context: { ...FONTS.regular, fontWeight: '600', lineHeight: 24, marginTop: SPACING.base },
  progressText: { ...FONTS.tiny, marginTop: SPACING.xs },
  group: { marginTop: SPACING.base, marginBottom: SPACING.sm },
  groupTitle: { ...FONTS.h4 },
  groupHelp: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2, lineHeight: 20 },
  matchTitle: { ...FONTS.regular, fontWeight: '600', marginTop: SPACING.sm },
  matchList: { backgroundColor: COLORS.primaryLighter, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.xs },
  matchItem: { ...FONTS.small, lineHeight: 22 },
  question: { marginBottom: SPACING.base },
  qText: { ...FONTS.regular, lineHeight: 24, marginBottom: SPACING.sm },
  qNumber: { fontWeight: '800', color: COLORS.primary },
  option: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.card, marginBottom: SPACING.xs },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optionText: { ...FONTS.regular, flex: 1 },
  gapInput: { ...FONTS.regular, color: COLORS.text, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, ...Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } }) },
  waitHint: { ...FONTS.tiny, textAlign: 'center', marginBottom: SPACING.sm },
});

export default IeltsListeningTaskScreen;
