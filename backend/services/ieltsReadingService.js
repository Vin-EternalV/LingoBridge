// AI side of IELTS Reading: writes an original passage with questions and an answer key.
// The learner's answers are marked by the server against that key (not by the AI).
const { callAI } = require('./aiService');

const readingSchema = {
  name: 'ielts_reading_test',
  definition: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'paragraphs', 'headings', 'questions'],
    properties: {
      title: { type: 'string' },
      paragraphs: { type: 'array', items: { type: 'string' } },
      headings: { type: 'array', items: { type: 'string' } },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'question', 'options', 'answer', 'acceptedAnswers', 'paragraph', 'explanation', 'evidence'],
          properties: {
            type: { type: 'string', enum: ['tfng', 'mcq', 'completion', 'heading'] },
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            answer: { type: 'string' },
            acceptedAnswers: { type: 'array', items: { type: 'string' } },
            paragraph: { type: 'string' },
            explanation: { type: 'string' },
            evidence: { type: 'string' },
          },
        },
      },
    },
  },
};

exports.generateReadingTest = async ({ topic }) => {
  const topicLine = topic
    ? `The passage topic is: "${topic}".`
    : 'Choose a typical IELTS Academic topic (science, history, environment, education, technology, psychology, health, urban life...).';

  return callAI({
    instructions:
      'You write original IELTS Academic-style Reading tests with a careful answer key. Never copy real exam passages. Return only the requested JSON.',
    input: `${topicLine}

Write ONE reading test.

PASSAGE
- "title": a short title. "paragraphs": exactly 5 paragraphs (they will be labelled A to E), 450 to 550 words in total, formal academic style.
- The content must be general, plausible or invented. Do not quote exact real statistics and do not name real people or organisations.

"headings": exactly 7 short headings (3 to 8 words each). Five describe paragraphs A to E accurately. Two are plausible decoys that match no paragraph.

"questions": exactly 13, in this order:
1. THREE questions with type "heading". "question" is "Paragraph X" (X = a paragraph letter, three different letters). "paragraph" is that same letter. "options" is []. "answer" is the EXACT text of the correct heading from "headings". "evidence" is a short phrase copied from that paragraph.
2. FOUR questions with type "tfng" (True / False / Not Given). "question" is a statement. "options" is []. "answer" is exactly "True", "False" or "Not Given". Use at least one of each. "Not Given" means the passage says nothing about it at all (not merely that it is hard to find).
3. THREE questions with type "mcq". "question" is the question, "options" has exactly 4 answer texts (no A/B/C/D letters), "answer" is the EXACT text of the one correct option, and exactly one option must be clearly correct.
4. THREE questions with type "completion". "question" is a sentence that paraphrases the passage with "______" in place of 1 to 3 words. "options" is []. "answer" is the missing word(s) exactly as they appear in the passage (maximum 3 words). "acceptedAnswers" lists other acceptable spellings or forms (or is []).

For EVERY question: "paragraph" is the letter (A to E) where the answer is found; "explanation" is 1 to 2 simple sentences saying why the answer is correct; "evidence" is the exact sentence or phrase copied word for word from the passage that proves it (use an empty string for "Not Given").
Make sure every answer is fully supported by the passage and the answer key is correct.`,
    schema: readingSchema,
  });
};
