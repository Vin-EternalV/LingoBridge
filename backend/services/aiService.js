const generateMockExercises = (skill, topic, difficulty, count) => {
  const exercises = [];
  for (let i = 0; i < count; i++) {
    if (skill === 'grammar' || skill === 'vocabulary') {
      exercises.push({
        id: `mock_mc_${i}`,
        type: 'multiple_choice',
        question: `Sample ${skill} question about ${topic} (${difficulty})`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        explanation: `Explanation for mock question ${i} on ${topic}.`
      });
    } else if (skill === 'reading') {
      exercises.push({
        id: `mock_rc_${i}`,
        type: 'reading_comprehension',
        passage: `This is a sample reading passage about ${topic}.`,
        question: `What is the main idea of the passage?`,
        options: ['Idea 1', 'Idea 2', 'Idea 3', 'Idea 4'],
        correctAnswer: 'Idea 1',
        explanation: `Idea 1 is the main theme.`
      });
    } else if (skill === 'writing') {
      exercises.push({
        id: `mock_wp_${i}`,
        type: 'writing_prompt',
        prompt: `Write a short paragraph about ${topic}.`,
        instructions: `Use at least 50 words.`,
        minWords: 50,
        targetVocab: ['word1', 'word2']
      });
    } else {
      exercises.push({
        id: `mock_sp_${i}`,
        type: 'speaking_prompt',
        prompt: `Talk about ${topic} for 1 minute.`,
        instructions: `Be sure to mention your personal experience.`,
        keyPhrases: ['In my opinion', 'On the other hand']
      });
    }
  }
  return exercises;
};

const evaluateMockAnswer = (exercise, userAnswer, learnerLevel) => {
  const isCorrect = typeof userAnswer === 'string' 
    ? (exercise.correctAnswer && userAnswer.toLowerCase() === exercise.correctAnswer.toLowerCase())
    : false;
  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
    correctAnswer: exercise.correctAnswer || 'N/A',
    explanation: isCorrect ? 'Great job!' : 'Let\'s review this.',
    whyIncorrect: isCorrect ? null : 'The answer provided was not accurate.',
    example: `Here is an example of correct usage...`,
    suggestedImprovement: `Try to focus on...`
  };
};

const chatMockAssistant = (messages, learnerLevel, userProfile) => {
  return "This is a mock AI tutor response. If an API key is provided, I would help you learn English here!";
};

exports.generateExercise = async ({ skill, topic, difficulty, learnerLevel, previousPerformance, count = 5 }) => {
  if (!process.env.AI_API_KEY) {
    return generateMockExercises(skill, topic, difficulty, count);
  }
  try {
    // Placeholder for actual AI fetch request.
    // In a real scenario, this would use fetch or an SDK to call OpenAI or Anthropic.
    // For now, simulating API by returning mock for robustness if it fails.
    return generateMockExercises(skill, topic, difficulty, count);
  } catch (error) {
    console.error('AI Generation Error:', error);
    return generateMockExercises(skill, topic, difficulty, count);
  }
};

exports.evaluateAnswer = async ({ exercise, userAnswer, learnerLevel }) => {
  if (!process.env.AI_API_KEY) {
    return evaluateMockAnswer(exercise, userAnswer, learnerLevel);
  }
  try {
    return evaluateMockAnswer(exercise, userAnswer, learnerLevel);
  } catch (error) {
    console.error('AI Evaluation Error:', error);
    return evaluateMockAnswer(exercise, userAnswer, learnerLevel);
  }
};

exports.chatAssistant = async ({ messages, learnerLevel, userProfile }) => {
  if (!process.env.AI_API_KEY) {
    return chatMockAssistant(messages, learnerLevel, userProfile);
  }
  try {
    return chatMockAssistant(messages, learnerLevel, userProfile);
  } catch (error) {
    console.error('AI Chat Error:', error);
    return chatMockAssistant(messages, learnerLevel, userProfile);
  }
};
