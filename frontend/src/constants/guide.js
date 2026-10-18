// Steps of the welcome guide. Edit the text here.
export const GUIDE_STEPS = [
  {
    icon: 'sparkles',
    color: '#2563EB',
    title: 'Welcome to LingoBridge',
    text: 'This one-minute tour shows you where everything is. You can open it again any time from Profile, then App guide.',
    tips: [],
  },
  {
    icon: 'book',
    color: '#8B5CF6',
    title: 'Practice every skill',
    text: 'Open the Practice tab to train grammar, vocabulary, reading, writing and speaking. Short exercises are a good way to warm up.',
    tips: ['Pick a topic you like and use the difficulty unlocked for your current level.', 'A little practice every day works better than a lot once a week.'],
  },
  {
    icon: 'ribbon',
    color: '#0EA5E9',
    title: 'IELTS-style practice',
    ieltsOnly: true,
    text: 'The Practice tab also has IELTS-style Listening, Reading, Writing and Speaking tasks.',
    tips: [
      'Listening: use headphones. In exam mode the recording plays only once.',
      'Reading: 20 minutes and 13 questions.',
      'Writing: Task 1 needs 150 or more words, Task 2 needs 250 or more.',
      'Speaking: type your answer, or speak it with the microphone.',
    ],
  },
  {
    icon: 'checkmark-done',
    color: '#10B981',
    title: 'Instant feedback',
    ieltsOnly: true,
    text: 'Reading and Listening are marked straight away with explanations. AI marks your Writing and Speaking and shows what to improve.',
    tips: ['Bands are estimates for practice, not official IELTS results.', 'Read the corrections: they are taken from your own answers.'],
  },
  {
    icon: 'chatbubble-ellipses',
    color: '#EC4899',
    title: 'Ask the AI tutor',
    text: 'The AI Assistant tab answers grammar questions, gives example sentences and helps with vocabulary.',
    tips: ['AI can make mistakes, so check important answers with a teacher.', 'Do not share passwords or private details in the chat.'],
  },
  {
    icon: 'stats-chart',
    color: '#F59E0B',
    title: 'Track your progress',
    text: 'In Learning progression, track your skill sessions, current level and what you need to unlock next.',
    tips: [
      'In Profile, Privacy & Security lets you download your data, clear AI history or delete your account.',
    ],
  },
  {
    icon: 'stats-chart',
    color: '#F59E0B',
    title: 'IELTS progress',
    ieltsOnly: true,
    text: 'In Practice, open IELTS mock test and progress to set a target band, take a timed mock test and see your estimated band.',
    tips: ['Take a mock test in one sitting, in a quiet place.'],
  },
];
