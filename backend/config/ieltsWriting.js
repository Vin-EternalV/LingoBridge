// Settings for the IELTS-style Writing practice. Keep minWords/minutes in sync with the screens
// (the server sends them with every task, so the app never needs its own copy).
const TASKS = {
  task1: { label: 'Task 1', minWords: 150, minutes: 20 },
  task2: { label: 'Task 2', minWords: 250, minutes: 40 },
};

const MODULES = ['academic', 'general'];

const MIN_SCORABLE_WORDS = 30; // below this there is too little text to mark
const MAX_WORDS = 1000;
const MAX_ESSAY_CHARS = 8000;

// IELTS names the first criterion differently for each task.
const CRITERIA = [
  { key: 'taskResponse', label: { task1: 'Task Achievement', task2: 'Task Response' } },
  { key: 'coherence', label: { task1: 'Coherence and Cohesion', task2: 'Coherence and Cohesion' } },
  { key: 'lexical', label: { task1: 'Lexical Resource', task2: 'Lexical Resource' } },
  { key: 'grammar', label: { task1: 'Grammatical Range and Accuracy', task2: 'Grammatical Range and Accuracy' } },
];

const countWords = (text) => (String(text || '').trim().match(/\S+/g) || []).length;

// Bands go in half steps from 0 to 9.
const toBand = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(9, Math.max(0, Math.round(n * 2) / 2));
};

// IELTS rule: the overall band is the average of the four criteria, rounded to the nearest half band
// (6.25 becomes 6.5, 6.75 becomes 7.0).
const overallBand = (bands) => toBand(bands.reduce((sum, b) => sum + b, 0) / bands.length);

module.exports = {
  TASKS,
  MODULES,
  MIN_SCORABLE_WORDS,
  MAX_WORDS,
  MAX_ESSAY_CHARS,
  CRITERIA,
  countWords,
  toBand,
  overallBand,
};
