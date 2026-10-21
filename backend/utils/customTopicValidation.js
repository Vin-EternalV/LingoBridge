const SEXUAL_TOPIC_PATTERN = /\b(sex|sexual|porn|pornography|erotic|erotica|nude|nudity|genital|intercourse|orgasm|masturbat\w*|fetish|brothel|prostitut\w*|rape|incest)\b/i;
const ENGLISH_TRAINING_PATTERN = /\b(english|grammar|vocabulary|vocab|word\w*|sentence\w*|tense\w*|verb\w*|adjective\w*|adverb\w*|preposition\w*|article\w*|punctuation|spelling|pronunciation|phonics|idiom\w*|phrase\w*|conversation\w*|speak\w*|writ\w*|read\w*|comprehension|essay\w*|paragraph\w*|email\w*|communication|question\w*|introduc\w*|describ\w*|opinion\w*|interview\w*|presentation\w*|story\w*|summar\w*|conditionals?|passive voice|past tense|present tense|future tense)\b/i;

function validateCustomTopic(topic) {
  const value = typeof topic === 'string' ? topic.trim() : '';
  if (containsSexualTopic(value)) {
    return 'Sexual content is not allowed. Enter a safe English-learning topic.';
  }
  if (!ENGLISH_TRAINING_PATTERN.test(value)) {
    return 'Custom topics must focus on English learning, such as grammar, vocabulary, reading, writing, or conversation.';
  }
  return null;
}

function containsSexualTopic(topic) {
  return SEXUAL_TOPIC_PATTERN.test(topic);
}

module.exports = { validateCustomTopic, containsSexualTopic };
