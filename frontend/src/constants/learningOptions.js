// Same ids the onboarding screens use, so profile edits stay consistent with onboarding.
export const LEVELS = [
  { id: 'beginner', title: 'Easy / Beginner', description: 'Start with the basics' },
  { id: 'intermediate', title: 'Intermediate', description: 'I can have simple conversations' },
  { id: 'advanced', title: 'Advanced', description: "I'm fluent but want to improve" },
];

export const GOALS = [
  { id: 'grammar', title: 'Improve Grammar' },
  { id: 'vocabulary', title: 'Expand Vocabulary' },
  { id: 'communication', title: 'Improve Communication' },
  { id: 'writing', title: 'Improve Writing' },
  { id: 'overall', title: 'Improve Overall English' },
];

export const AREAS = [
  { id: 'grammar', title: 'Grammar' },
  { id: 'vocabulary', title: 'Vocabulary' },
  { id: 'reading', title: 'Reading' },
  { id: 'writing', title: 'Writing' },
  { id: 'speaking', title: 'Speaking' },
];

export const DIFFICULTIES = [
  { id: 'grammar_rules', title: 'Grammar rules' },
  { id: 'vocabulary', title: 'Vocabulary/word choice' },
  { id: 'reading', title: 'Reading comprehension' },
  { id: 'writing', title: 'Writing clearly' },
  { id: 'speaking', title: 'Speaking/pronunciation' },
  { id: 'sentence_structure', title: 'Sentence structure' },
  { id: 'tenses', title: 'Tenses' },
  { id: 'prepositions', title: 'Prepositions' },
  { id: 'articles', title: 'Articles (a, an, the)' },
];

export const levelLabel = (id) => LEVELS.find((level) => level.id === id)?.title || null;

export const TOPICS_BY_SKILL = {
  grammar: ['Present Tenses', 'Past Tenses', 'Prepositions', 'Articles', 'Conditionals', 'Passive Voice'],
  vocabulary: ['Everyday Phrases', 'Academic Words', 'Business English', 'Synonyms & Antonyms', 'Idioms'],
  reading: ['Short Stories', 'News Articles', 'Opinion Pieces', 'Email Messages'],
  writing: ['Formal Emails', 'Essay Structure', 'Descriptive Paragraphs', 'Sentence Variety'],
  speaking: ['Self Introductions', 'Expressing Opinions', 'Asking Questions', 'Daily Conversations'],
};
