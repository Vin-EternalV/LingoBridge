// services/aiService.js
const GEMINI_URL_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const OPENAI_URL = "https://api.openai.com/v1/responses";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

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

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const sanitizeSchemaForGemini = (schema) => {
  if (Array.isArray(schema)) return schema.map(sanitizeSchemaForGemini);
  if (schema && typeof schema === "object") {
    const out = {};
    for (const [k, v] of Object.entries(schema)) {
      if (k === "additionalProperties") continue;
      out[k] = sanitizeSchemaForGemini(v);
    }
    return out;
  }
  return schema;
};

const buildOllamaSchemaHint = (schema) => {
  if (!schema?.definition) return "";
  const required = schema.definition?.required || [];
  const props = schema.definition?.properties || {};

  const example = Object.fromEntries(
    required.map((k) => {
      const type = props[k]?.type;
      if (type === "array") {
        const itemType = props[k]?.items?.type;
        if (itemType === "object") {
          const itemRequired = props[k]?.items?.required || [];
          const itemProps = props[k]?.items?.properties || {};
          const sample = Object.fromEntries(
            itemRequired.map((ik) => {
              const itype = itemProps[ik]?.type;
              if (itype === "array") return [ik, []];
              if (itype === "number") return [ik, 0];
              if (itype === "boolean") return [ik, false];
              return [ik, "string"];
            }),
          );
          return [k, [sample]];
        }
        return [k, []];
      }
      if (type === "number") return [k, 0];
      if (type === "boolean") return [k, false];
      return [k, "string"];
    }),
  );

  return `\n\n=== OUTPUT FORMAT (MANDATORY) ===
Return ONLY a valid JSON object. No markdown. No code fences. No text before or after.
The JSON MUST have exactly these required keys: ${required.join(", ")}.
Example of valid shape:
${JSON.stringify(example, null, 2)}

IMPORTANT:
1. Every "correctAnswer" value must be EXACTLY one of the strings listed in "options" for that exercise — same wording, same case, no extra text.
2. Every exercise "type" must be exactly the string "multiple_choice".
Your reply must begin with "{" and end with "}".`;
};

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

const normalize = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

const getGeminiModel = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";
const getOllamaModel = () => process.env.OLLAMA_MODEL || "llama3.1:8b";

/* ------------------------------------------------------------------ */
/* Gemini                                                              */
/* ------------------------------------------------------------------ */

const callGemini = async ({ instructions, input, schema }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw createError(
      "AI is not configured. Add GEMINI_API_KEY to the backend environment.",
    );
  }

  const model = getGeminiModel();
  const url = `${GEMINI_URL_BASE}/${model}:generateContent?key=${apiKey}`;

  const prompt = Array.isArray(input)
    ? `${instructions}\n\nConversation:\n${input
        .map((item) => `${item.role}: ${item.content}`)
        .join("\n")}`
    : `${instructions}\n\n${input}`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          ...(schema?.definition
            ? { responseSchema: sanitizeSchemaForGemini(schema.definition) }
            : {}),
        },
      }),
    });
  } catch (error) {
    console.error("[AI] Gemini network error:", error.message);
    throw createError(
      "Unable to reach the Gemini API. Please try again later.",
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg =
      body?.error?.message || body?.error?.status || "unknown error";
    console.error("[AI] Gemini provider error:", response.status, errMsg);

    if (response.status === 401 || response.status === 403) {
      throw createError("The Gemini API key is invalid or unavailable.");
    }
    if (response.status === 429) {
      throw createError(
        "The Gemini API free-tier limit has been reached. Falling back…",
      );
    }
    throw createError("The Gemini service is temporarily unavailable.");
  }

  const output = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!output) {
    console.error("[AI] Gemini returned no output:", body);
    throw createError("The Gemini API returned an empty response.");
  }

  return {
    data: parseJson(output),
    tokensUsed:
      body?.usageMetadata?.totalTokenCount ||
      body?.usage_metadata?.total_token_count ||
      0,
    provider: "gemini",
  };
};

/* ------------------------------------------------------------------ */
/* Ollama (local)                                                      */
/* ------------------------------------------------------------------ */

const callOllama = async ({ instructions, input, schema }) => {
  const model = getOllamaModel();

  const conversation = Array.isArray(input)
    ? `${instructions}\n\nConversation:\n${input
        .map((item) => `${item.role}: ${item.content}`)
        .join("\n")}`
    : `${instructions}\n\n${input}`;

  const wantsJson = !!schema?.definition;
  const schemaHint = wantsJson ? buildOllamaSchemaHint(schema) : "";
  const prompt = conversation + schemaHint;

  let response;
  try {
    response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        ...(wantsJson ? { format: "json" } : {}),
        options: { temperature: 0.4 },
      }),
    });
  } catch (error) {
    console.error("[AI] Ollama network error:", error.message);
    throw createError(
      "Unable to reach the local Ollama server. Make sure `ollama serve` is running.",
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      "[AI] Ollama provider error:",
      response.status,
      body?.error || "unknown",
    );
    throw createError("The local Ollama service is unavailable.");
  }

  const output = body?.response;
  if (!output) {
    throw createError("Ollama returned an empty response.");
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[AI] Ollama raw output (first 300 chars):",
      output.slice(0, 300),
    );
  }

  return {
    data: parseJson(output),
    tokensUsed: body?.eval_count || 0,
    provider: "ollama",
  };
};

/* ------------------------------------------------------------------ */
/* OpenAI (kept as backup)                                             */
/* ------------------------------------------------------------------ */

const callOpenAI = async ({ instructions, input, schema }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw createError("OpenAI is not configured. Add AI_API_KEY to .env.");
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
    console.error("[AI] OpenAI network error:", error.message);
    throw createError("Unable to reach the OpenAI API.");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[AI] OpenAI provider error:", response.status, body?.error);
    throw createError("The OpenAI service is temporarily unavailable.");
  }

  const output =
    body.output_text ||
    body.output
      ?.flatMap((item) => item.content || [])
      .find((item) => item.type === "output_text")?.text;

  if (!output) throw createError("OpenAI returned an empty response.");

  return {
    data: parseJson(output),
    tokensUsed: body.usage?.total_tokens || 0,
    provider: "openai",
  };
};

/* ------------------------------------------------------------------ */
/* Provider Selector with Auto Fallback                                */
/* ------------------------------------------------------------------ */

const callAI = async ({ instructions, input, schema }) => {
  const provider = (process.env.AI_PROVIDER || "auto").toLowerCase();

  if (provider === "gemini") return callGemini({ instructions, input, schema });
  if (provider === "ollama") return callOllama({ instructions, input, schema });
  if (provider === "openai") return callOpenAI({ instructions, input, schema });

  if (provider === "auto") {
    const chain = [
      { name: "gemini", fn: callGemini },
      { name: "ollama", fn: callOllama },
    ];

    let lastErr;
    for (const { name, fn } of chain) {
      try {
        const result = await fn({ instructions, input, schema });
        console.log(`[AI] Served by ${name} (auto mode)`);
        return result;
      } catch (err) {
        lastErr = err;
        console.warn(
          `[AI] ${name} failed (${err.statusCode || "?"}): ${err.message}`,
        );
      }
    }
    throw lastErr || createError("All AI providers failed.");
  }

  throw createError(`Unsupported AI provider: ${provider}`, 500);
};

/* ------------------------------------------------------------------ */
/* Exercise Answer Matcher                                             */
/* ------------------------------------------------------------------ */

const matchCorrectAnswer = (answer, options, exerciseIndex) => {
  if (!Array.isArray(options) || options.length === 0) return null;

  const raw = String(answer || "").trim();

  let matched = options.find((opt) => opt === raw);
  if (matched) return matched;

  matched = options.find((opt) => normalize(opt) === normalize(raw));
  if (matched) return matched;

  if (/^[A-Da-d][).:\-\s]/.test(raw) || /^[A-Da-d]$/.test(raw)) {
    const idx = "abcd".indexOf(raw[0].toLowerCase());
    if (idx >= 0 && options[idx] !== undefined) return options[idx];
  }

  matched = options.find(
    (opt) => opt.trim() && normalize(raw).includes(normalize(opt)),
  );
  if (matched) return matched;

  matched = options.find(
    (opt) => opt.trim() && normalize(opt).includes(normalize(raw)),
  );
  if (matched) return matched;

  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[AI] Exercise ${exerciseIndex}: correctAnswer "${raw}" doesn't match options`,
      options,
    );
  }
  return options[0];
};

const cleanExercises = (exercises) => {
  if (!Array.isArray(exercises)) return [];

  return exercises
    .map((exercise, index) => {
      if (!Array.isArray(exercise?.options) || exercise.options.length < 2) {
        return null;
      }
      const matched = matchCorrectAnswer(
        exercise.correctAnswer,
        exercise.options,
        index,
      );
      if (!matched) return null;

      return {
        ...exercise,
        id: exercise.id || `q${index + 1}`,
        // ✅ FORCE type to multiple_choice so frontend renderer always knows
        type: "multiple_choice",
        correctAnswer: matched,
      };
    })
    .filter(Boolean);
};

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */

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
            id: { type: "string" },
            type: { type: "string", enum: ["multiple_choice"] },
            question: { type: "string" },
            options: {
              type: "array",
              minItems: 2,
              maxItems: 4,
              items: { type: "string" },
            },
            correctAnswer: { type: "string" },
            explanation: { type: "string" },
          },
        },
      },
    },
  },
};

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
      isCorrect: { type: "boolean" },
      score: { type: "number", minimum: 0, maximum: 100 },
      correctAnswer: { type: "string" },
      explanation: { type: "string" },
      whyIncorrect: { type: "string" },
      example: { type: "string" },
      suggestedImprovement: { type: "string" },
    },
  },
};

const chatSchema = {
  name: "tutor_reply",
  definition: {
    type: "object",
    additionalProperties: false,
    required: ["response"],
    properties: {
      response: { type: "string", minLength: 1, maxLength: 2000 },
    },
  },
};

/* ------------------------------------------------------------------ */
/* Public functions                                                    */
/* ------------------------------------------------------------------ */

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
      'You create safe, accurate English-learning multiple-choice exercises. Return only the requested JSON. Every "type" must be exactly "multiple_choice". Every "correctAnswer" must be exactly one of the strings in "options".',
    input: `Create ${exerciseCount} ${difficulty} ${skill} exercises about "${topic}" for a ${learnerLevel || "general"} English learner.`,
    schema: exerciseSchema,
  });

  const cleaned = cleanExercises(result.data?.exercises);

  if (cleaned.length === 0) {
    throw createError(
      "The AI returned invalid exercise data. Please try again.",
    );
  }

  result.data.exercises = cleaned;
  return result;
};

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
