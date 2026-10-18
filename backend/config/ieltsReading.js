// IELTS-style Reading practice: one passage, 13 questions, 20 minutes.
const READING = {
  minutes: 20,
  // How many of each question type the AI is asked for (in the order they appear on screen).
  plan: [
    { type: 'heading', count: 3 },
    { type: 'tfng', count: 4 },
    { type: 'mcq', count: 3 },
    { type: 'completion', count: 3 },
  ],
  minQuestions: 10, // a test with fewer valid questions than this is thrown away and the learner retries
  maxQuestions: 14,
  minPassageWords: 200,
};

const TFNG = ['True', 'False', 'Not Given'];
const TYPE_ORDER = ['heading', 'tfng', 'mcq', 'completion'];

// Approximate IELTS Academic Reading conversion (raw score out of 40 -> band).
// A shorter test is scaled to 40 first. Real conversions vary slightly from test to test.
const BAND_TABLE = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5],
  [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [1, 1], [0, 0],
];

const scoreToBand = (score, total) => {
  if (!total) return 0;
  const scaled = Math.round((score / total) * 40);
  for (const [min, band] of BAND_TABLE) if (scaled >= min) return band;
  return 0;
};

// Lowercase, no surrounding punctuation, single spaces. Used to compare typed answers.
const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[“”"‘’]/g, '')
    .replace(/^[\s.,;:!?()-]+|[\s.,;:!?()-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const stripArticle = (value) => value.replace(/^(the|a|an)\s+/, '');

module.exports = { READING, TFNG, TYPE_ORDER, scoreToBand, normalize, stripArticle };
