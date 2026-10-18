// Settings for IELTS-style Speaking practice (answers are typed or dictated, then marked as text).
const { countWords, toBand, overallBand } = require('./ieltsWriting');

const PARTS = {
  part1: { label: 'Part 1', questions: 4, minTotalWords: 40 },
  part2: { label: 'Part 2', questions: 1, minTotalWords: 60, prepSeconds: 60, speakSeconds: 120 },
  part3: { label: 'Part 3', questions: 4, minTotalWords: 60 },
};

const MIN_ANSWER_WORDS = 3;
const MAX_ANSWER_CHARS = 3000;

// Pronunciation is the fourth IELTS Speaking criterion. It needs audio, so it is NOT scored here,
// and the overall band is the average of the three criteria below.
const CRITERIA = [
  { key: 'fluency', label: 'Fluency and Coherence' },
  { key: 'lexical', label: 'Lexical Resource' },
  { key: 'grammar', label: 'Grammatical Range and Accuracy' },
];

module.exports = { PARTS, MIN_ANSWER_WORDS, MAX_ANSWER_CHARS, CRITERIA, countWords, toBand, overallBand };
