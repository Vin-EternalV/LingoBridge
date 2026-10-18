// IELTS Listening practice limits and approximate Academic Listening band conversion.
const LISTENING = {
  kinds: ['conversation', 'talk'],
  minutes: 20,
  prepSeconds: 30,
  minScriptWords: 250,
  maxScriptWords: 900,
  minQuestions: 8,
  maxQuestions: 12,
};

const TYPE_ORDER = ['matching', 'mcq', 'completion'];
const BAND_TABLE = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5],
  [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [1, 1], [0, 0],
];

const normalize = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/["'“”‘’]/g, '')
  .replace(/^[\s.,;:!?()[\]{}-]+|[\s.,;:!?()[\]{}-]+$/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const stripArticle = (value) => value.replace(/^(the|a|an)\s+/, '');

const scoreToBand = (score, total) => {
  if (!total) return 0;
  const scaled = Math.round((score / total) * 40);
  return BAND_TABLE.find(([minimum]) => scaled >= minimum)?.[1] ?? 0;
};

module.exports = { LISTENING, TYPE_ORDER, normalize, stripArticle, scoreToBand };
