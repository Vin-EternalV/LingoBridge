import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const ExerciseRenderer = ({ exercise, userAnswer, onChangeAnswer, disabled = false }) => {
  const [showHint, setShowHint] = useState(false);

  const renderMultipleChoice = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.questionText}>{exercise.question}</Text>
      {exercise.options.map((option, index) => {
        const isSelected = userAnswer === option;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.mcOption, isSelected && styles.mcOptionSelected]}
            onPress={() => onChangeAnswer(option)}
            disabled={disabled}
          >
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.mcOptionText, isSelected && styles.mcOptionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFillInBlank = () => {
    // The sentence contains "___"
    const parts = exercise.sentence.split('___');
    
    return (
      <View style={styles.inputExerciseContainer}>
        <View style={styles.fibContainer}>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <Text style={styles.fibText}>{part}</Text>
              {index < parts.length - 1 && (
                <TextInput
                  style={styles.fibInput}
                  value={userAnswer || ''}
                  onChangeText={onChangeAnswer}
                  editable={!disabled}
                  placeholder="type here"
                />
              )}
            </React.Fragment>
          ))}
        </View>
        <TouchableOpacity style={styles.hintButton} onPress={() => setShowHint(!showHint)}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
          <Text style={styles.hintText}>Hint</Text>
        </TouchableOpacity>
        {showHint && exercise.hint && (
          <Text style={styles.hintContent}>{exercise.hint}</Text>
        )}
      </View>
    );
  };

  const renderSentenceCorrection = () => (
    <View style={styles.inputExerciseContainer}>
      <View style={styles.correctionBox}>
        <Ionicons name="alert-circle-outline" size={20} color={COLORS.error} />
        <Text style={styles.incorrectSentence}>{exercise.sentence}</Text>
      </View>
      <Text style={styles.instructionText}>Correct the sentence below:</Text>
      <TextInput
        style={styles.textArea}
        multiline
        value={userAnswer || ''}
        onChangeText={onChangeAnswer}
        editable={!disabled}
        placeholder="Type the correct sentence..."
      />
    </View>
  );

  const renderReadingComprehension = () => (
    <View style={styles.container}>
      <View style={styles.passageBox}>
        <Text style={styles.passageText}>{exercise.passage}</Text>
      </View>
      <Text style={styles.questionText}>{exercise.question}</Text>
      {exercise.options.map((option, index) => {
        const isSelected = userAnswer === option;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.mcOption, isSelected && styles.mcOptionSelected]}
            onPress={() => onChangeAnswer(option)}
            disabled={disabled}
          >
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.mcOptionText, isSelected && styles.mcOptionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderShortAnswer = () => (
    <View style={styles.inputExerciseContainer}>
      <Text style={styles.questionText}>{exercise.prompt}</Text>
      <TextInput
        style={styles.textArea}
        multiline
        value={userAnswer || ''}
        onChangeText={onChangeAnswer}
        editable={!disabled}
        placeholder="Type your answer here..."
      />
    </View>
  );

  const renderWritingPrompt = () => {
    const wordCount = userAnswer ? userAnswer.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    return (
      <View style={styles.inputExerciseContainer}>
        <Text style={styles.questionText}>{exercise.prompt}</Text>
        {exercise.guidelines && (
          <View style={styles.guidelinesBox}>
            <Text style={styles.guidelinesTitle}>Guidelines:</Text>
            {exercise.guidelines.map((guide, i) => (
              <Text key={i} style={styles.guidelinesText}>• {guide}</Text>
            ))}
          </View>
        )}
        <View style={styles.textAreaWrapper}>
          <TextInput
            style={[styles.textArea, styles.largeTextArea]}
            multiline
            value={userAnswer || ''}
            onChangeText={onChangeAnswer}
            editable={!disabled}
            placeholder="Start writing..."
            textAlignVertical="top"
          />
          <Text style={styles.wordCount}>{wordCount} words</Text>
        </View>
      </View>
    );
  };

  const renderSpeakingPrompt = () => (
    <View style={styles.inputExerciseContainer}>
      <Text style={styles.questionText}>{exercise.prompt}</Text>
      {exercise.keyPhrases && (
        <View style={styles.guidelinesBox}>
          <Text style={styles.guidelinesTitle}>Try to include:</Text>
          {exercise.keyPhrases.map((phrase, i) => (
            <Text key={i} style={styles.guidelinesText}>• {phrase}</Text>
          ))}
        </View>
      )}
      <View style={styles.recordingArea}>
        <TouchableOpacity style={styles.recordButton} disabled={disabled}>
          <Ionicons name="mic" size={40} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.recordInstruction}>Tap to record (Simulated)</Text>
      </View>
      <Text style={styles.orText}>OR write your response:</Text>
      <TextInput
        style={styles.textArea}
        multiline
        value={userAnswer || ''}
        onChangeText={onChangeAnswer}
        editable={!disabled}
        placeholder="Type what you would say..."
      />
    </View>
  );

  if (!exercise) return null;

  switch (exercise.type) {
    case 'multiple_choice': return renderMultipleChoice();
    case 'fill_in_blank': return renderFillInBlank();
    case 'sentence_correction': return renderSentenceCorrection();
    case 'reading_comprehension': return renderReadingComprehension();
    case 'short_answer': return renderShortAnswer();
    case 'writing_prompt': return renderWritingPrompt();
    case 'speaking_prompt': return renderSpeakingPrompt();
    default: return <Text>Unsupported exercise type</Text>;
  }
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  questionText: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  optionsContainer: {
    width: '100%',
  },
  mcOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.base,
    backgroundColor: COLORS.white,
  },
  mcOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  mcOptionText: {
    ...FONTS.regular,
    color: COLORS.text,
    flex: 1,
  },
  mcOptionTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  inputExerciseContainer: {
    width: '100%',
  },
  fibContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  fibText: {
    ...FONTS.h3,
    color: COLORS.text,
    lineHeight: 40,
  },
  fibInput: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    minWidth: 100,
    marginHorizontal: SPACING.sm,
    ...FONTS.h3,
    color: COLORS.primaryDark,
    textAlign: 'center',
    paddingBottom: 4,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  hintText: {
    ...FONTS.small,
    color: COLORS.warning,
    marginLeft: 4,
    fontWeight: '600',
  },
  hintContent: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.warningLight,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
  },
  correctionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
  },
  incorrectSentence: {
    ...FONTS.regular,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    textDecorationLine: 'line-through',
  },
  instructionText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    ...FONTS.regular,
    backgroundColor: COLORS.white,
    minHeight: 100,
    color: COLORS.text,
  },
  largeTextArea: {
    minHeight: 200,
  },
  textAreaWrapper: {
    position: 'relative',
  },
  wordCount: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.base,
    ...FONTS.tiny,
    color: COLORS.textLight,
  },
  passageBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passageText: {
    ...FONTS.regular,
    color: COLORS.text,
    lineHeight: 24,
  },
  guidelinesBox: {
    backgroundColor: COLORS.primaryLighter,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
  },
  guidelinesTitle: {
    ...FONTS.small,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  guidelinesText: {
    ...FONTS.small,
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  recordingArea: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordInstruction: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  orText: {
    ...FONTS.small,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  }
});

export default ExerciseRenderer;
