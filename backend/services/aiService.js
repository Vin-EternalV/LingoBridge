const OPENAI_URL = "https://api.openai.com/v1/responses";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

const VALID_SKILLS = [
  "grammar",
  "vocabulary",
  "reading",
  "writing",
  "speaking",
];

const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

const createError = (message, statusCode = 503) =>
  Object.assign(new Error(message), { statusCode });

const parseJson = (value) => {
  const cleaned = String(value || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    throw createError(
      "The AI returned an unreadable response. Please try again.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| Gemini
|--------------------------------------------------------------------------
*/

const callGemini = async ({ instructions, input, schema }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw createError(
      "AI is not configured. Add GEMINI_API_KEY to the backend environment.",
    );
  }

  const model =
    process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-2.5-flash";

  const prompt = Array.isArray(input)
    ? `${instructions}\n\nConversation:\n${input
        .map((item) => `${item.role}: ${item.content}`)
        .join("\n")}`
    : `${instructions}\n\n${input}`;

  let response;

  try {
    response = await fetch(GEMINI_URL, {
      method: "POST",

      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model,
        input: prompt,

        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: schema.definition,
        },
      }),
    });
  } catch (error) {
    console.error("Gemini network error:", error);

    throw createError(
      "Unable to reach the AI provider. Please try again later.",
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      "Gemini provider error:",
      response.status,
      body?.error?.message || body?.error?.status || "unknown",
    );

    if (response.status === 401 || response.status === 403) {
      throw createError("The Gemini API key is invalid or unavailable.");
    }

    if (response.status === 429) {
      throw createError(
        "The Gemini API free-tier limit has been reached. Please try again later.",
      );
    }

    throw createError(
      "The AI service is temporarily unavailable. Please try again later.",
    );
  }

  const interactionOutput = body.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content || [])
    .map((content) =>
      typeof content === "string" ? content : content.text || content.value,
    )
    .find(Boolean);

  const output = body.output_text || body.outputText || interactionOutput;

  if (!output) {
    console.error("Gemini returned no output:", body);

    throw createError("The AI returned an empty response. Please try again.");
  }

  return {
    data: parseJson(output),

    tokensUsed:
      body.usage_metadata?.total_token_count ||
      body.usageMetadata?.totalTokenCount ||
      0,
  };
};

/*
|--------------------------------------------------------------------------
| OpenAI
|--------------------------------------------------------------------------
|
| Kept as a backup/provider option.
|
*/

const callOpenAI = async ({ instructions, input, schema }) => {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw createError(
      "AI is not configured. Add AI_API_KEY to the backend environment.",
    );
  }

  let response;

  try {
    response = await fetch(OPENAI_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4.1-mini",

        instructions,
        input,

        max_output_tokens: 1800,

        text: {
          format: {
            type: "json_schema",
            name: schema.name,
            strict: true,
            schema: schema.definition,
          },
        },
      }),
    });
  } catch (error) {
    console.error("OpenAI network error:", error);

    throw createError(
      "Unable to reach the AI provider. Please try again later.",
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      "OpenAI provider error:",
      response.status,
      body?.error?.message || body?.error?.type || "unknown",
    );

    throw createError(
      "The AI service is temporarily unavailable. Please try again later.",
    );
  }

  const output =
    body.output_text ||
    body.output
      ?.flatMap((item) => item.content || [])
      .find((item) => item.type === "output_text")?.text;

  if (!output) {
    throw createError("The AI returned an empty response. Please try again.");
  }

  return {
    data: parseJson(output),

    tokensUsed: body.usage?.total_tokens || 0,
  };
};

/*
|--------------------------------------------------------------------------
| AI Provider Selector
|--------------------------------------------------------------------------
*/

const callAI = async ({ instructions, input, schema }) => {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  if (provider === "gemini") {
    return callGemini({
      instructions,
      input,
      schema,
    });
  }

  if (provider === "openai") {
    return callOpenAI({
      instructions,
      input,
      schema,
    });
  }

  throw createError(`Unsupported AI provider: ${provider}`, 500);
};

/*
|--------------------------------------------------------------------------
| Exercise Schema
|--------------------------------------------------------------------------
*/

const exerciseSchema = {
  name: "practice_exercises",

  definition: {
    type: "object",

    additionalProperties: false,

    required: ["exercises"],

    properties: {
      exercises: {
        type: "array",

        minItems: 1,
        maxItems: 10,

        items: {
          type: "object",

          additionalProperties: false,

          required: [
            "id",
            "type",
            "question",
            "options",
            "correctAnswer",
            "explanation",
          ],

          properties: {
            id: {
              type: "string",
            },

            type: {
              type: "string",
              enum: ["multiple_choice"],
            },

            question: {
              type: "string",
            },

            options: {
              type: "array",

              minItems: 2,
              maxItems: 4,

              items: {
                type: "string",
              },
            },

            correctAnswer: {
              type: "string",
            },

            explanation: {
              type: "string",
            },
          },
        },
      },
    },
  },
};

/*
|--------------------------------------------------------------------------
| Answer Feedback Schema
|--------------------------------------------------------------------------
*/

const feedbackSchema = {
  name: "answer_feedback",

  definition: {
    type: "object",

    additionalProperties: false,

    required: [
      "isCorrect",
      "score",
      "correctAnswer",
      "explanation",
      "whyIncorrect",
      "example",
      "suggestedImprovement",
    ],

    properties: {
      isCorrect: {
        type: "boolean",
      },

      score: {
        type: "number",
        minimum: 0,
        maximum: 100,
      },

      correctAnswer: {
        type: "string",
      },

      explanation: {
        type: "string",
      },

      whyIncorrect: {
        type: "string",
      },

      example: {
        type: "string",
      },

      suggestedImprovement: {
        type: "string",
      },
    },
  },
};

/*
|--------------------------------------------------------------------------
| Tutor Chat Schema
|--------------------------------------------------------------------------
*/

const chatSchema = {
  name: "tutor_reply",

  definition: {
    type: "object",

    additionalProperties: false,

    required: ["response"],

    properties: {
      response: {
        type: "string",

        minLength: 1,
        maxLength: 2000,
      },
    },
  },
};

/*
|--------------------------------------------------------------------------
| Generate Exercises
|--------------------------------------------------------------------------
*/

exports.generateExercise = async ({
  skill,
  topic,
  difficulty,
  learnerLevel,
  count = 5,
}) => {
  if (
    !VALID_SKILLS.includes(skill) ||
    !VALID_DIFFICULTIES.includes(difficulty) ||
    !topic?.trim()
  ) {
    throw createError("Invalid practice request.", 400);
  }

  const exerciseCount = Math.min(Math.max(Number(count) || 5, 1), 10);

  const result = await callAI({
    instructions:
      "You create safe, accurate English-learning multiple-choice exercises. Return only the requested JSON. Make each answer exactly match one option.",

    input: `Create ${exerciseCount} ${difficulty} ${skill} exercises about "${topic}" for a ${learnerLevel || "general"} English learner.`,

    schema: exerciseSchema,
  });

  if (!result.data?.exercises || !Array.isArray(result.data.exercises)) {
    throw createError(
      "The AI returned invalid exercise data. Please try again.",
    );
  }

  const validExercises = result.data.exercises.every(
    (exercise) =>
      Array.isArray(exercise.options) &&
      exercise.options.includes(exercise.correctAnswer),
  );

  if (!validExercises) {
    throw createError(
      "The AI returned invalid exercise answers. Please try again.",
    );
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| Evaluate Answer
|--------------------------------------------------------------------------
*/

exports.evaluateAnswer = async ({ exercise, userAnswer, learnerLevel }) => {
  if (
    !exercise?.question ||
    typeof userAnswer !== "string" ||
    !userAnswer.trim()
  ) {
    throw createError("An exercise and answer are required.", 400);
  }

  return callAI({
    instructions:
      "You are a supportive English tutor. Evaluate the submitted answer against the supplied exercise. Give concise, constructive feedback and return only the requested JSON.",

    input: JSON.stringify({
      exercise,
      userAnswer,
      learnerLevel: learnerLevel || "general",
    }),

    schema: feedbackSchema,
  });
};

/*
|--------------------------------------------------------------------------
| AI Tutor Chat
|--------------------------------------------------------------------------
*/

exports.chatAssistant = async ({ messages, learnerLevel }) => {
  const safeMessages = (messages || [])
    .slice(-10)

    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",

      content: String(message.content || "").slice(0, 1000),
    }))

    .filter((message) => message.content.trim());

  if (!safeMessages.length) {
    throw createError("A message is required.", 400);
  }

  return callAI({
    instructions: `You are LingoBridge, a concise and encouraging English tutor for a ${learnerLevel || "general"} learner. Help with English only; do not claim to be a human.`,

    input: safeMessages,

    schema: chatSchema,
  });
};
