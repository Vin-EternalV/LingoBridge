const { callAI } = require('./aiService');
const { LISTENING } = require('../config/ieltsListening');

const listeningSchema = {
  name: 'ielts_listening_test',
  definition: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'context', 'turns', 'matchTitle', 'matchOptions', 'questions'],
    properties: {
      title: { type: 'string' },
      context: { type: 'string' },
      turns: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['speaker', 'text'],
          properties: { speaker: { type: 'string', enum: ['A', 'B'] }, text: { type: 'string' } },
        },
      },
      matchTitle: { type: 'string' },
      matchOptions: { type: 'array', items: { type: 'string' } },
      questions: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['type', 'question', 'options', 'answer', 'acceptedAnswers', 'explanation', 'evidence'],
          properties: {
            type: { type: 'string', enum: ['matching', 'mcq', 'completion'] },
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            answer: { type: 'string' },
            acceptedAnswers: { type: 'array', items: { type: 'string' } },
            explanation: { type: 'string' },
            evidence: { type: 'string' },
          },
        },
      },
    },
  },
};

exports.generateListeningTest = async ({ kind, topic }) => {
  const format = kind === 'talk'
    ? 'one speaker gives a clear informational talk'
    : 'a natural conversation between two speakers labelled A and B';
  const topicLine = topic
    ? `Use this topic: ${topic}.`
    : 'Choose a plausible IELTS topic such as travel, education, accommodation, community events, or workplace arrangements.';

  return callAI({
    instructions: 'Create original IELTS Listening practice content. Never copy real exam material. Return only the requested JSON and make every answer verifiable from the script.',
    input: `${topicLine}

Create one ${format} for an intermediate English learner.
- Write 300 to 450 spoken words split into 8 to 16 short turns. Use speaker A only for a talk; use A and B naturally for a conversation. The script will be spoken aloud, so use clear conversational English and no stage directions.
- Add a short title and a one-sentence context for the learner.
- Create exactly 10 questions in this order: 3 matching, 3 multiple choice, then 4 completion.
- For matching, provide a matchTitle, 5 to 7 concise matchOptions, and each answer must exactly equal one option. Use three different answers.
- For multiple choice, each question has exactly 3 short options and answer exactly equals one option.
- For completion, each question contains ___ where the missing one to three words belong; the answer must appear exactly in the script. acceptedAnswers may list alternate spellings.
- Every question needs a brief explanation and a short exact evidence quote from the script. Do not include answer labels like A/B/C in options.
- Ensure the spoken script contains all answers and evidence, and no question depends on outside knowledge.`,
    schema: listeningSchema,
  });
};
