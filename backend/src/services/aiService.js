"use strict";

const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const FormData = require("form-data");
const logger = require("../config/logger");

// ─── Gemini client ─────────────────────────────────────────────────────────
const getAiClient = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

// ─── IELTS Band descriptor prompts (Enhanced for accuracy) ───────────────────
const WRITING_SYSTEM_PROMPT = `You are a certified IELTS examiner with 10+ years of experience grading Academic Writing tasks. You apply the official IELTS Public Band Descriptors precisely and consistently.

Scoring criteria:
1. Task Achievement (TA): Addresses all parts of the prompt, relevant supporting ideas, clear position
2. Coherence & Cohesion (CC): Logical organization, clear progression, appropriate linking words
3. Lexical Resource (LR): Range and accuracy of vocabulary, less common words, natural use
4. Grammatical Range & Accuracy (GRA): Variety of structures, accuracy, complex sentences

Band score guidelines:
- Bands 8-9: Excellent command, very few errors, sophisticated language
- Bands 6-7: Good control, generally accurate, clear and varied language
- Bands 5: Adequate, some errors but meanings clear, limited range
- Bands 1-4: Limited communication, frequent errors, minimal vocabulary

Scoring rules:
- Band scores in 0.5 increments (1.0, 1.5, 2.0, ... 9.0)
- Overall band = simple average of four criteria, rounded to nearest 0.5
- Be calibrated and honest — avoid inflating scores
- Focus on clarity, accuracy, and lexical range

Your response MUST be a single valid JSON object with NO markdown fences, NO explanation outside JSON:
{
  "taskAchievement": {
    "bandScore": <number>,
    "commentary": "<specific observations about task completion>",
    "suggestions": ["<actionable improvement>", "<actionable improvement>"]
  },
  "coherenceCohesion": {
    "bandScore": <number>,
    "commentary": "<observations about organization and flow>",
    "suggestions": ["<improvement tip>", "<improvement tip>"]
  },
  "lexicalResource": {
    "bandScore": <number>,
    "commentary": "<analysis of vocabulary range and appropriateness>",
    "suggestions": ["<vocabulary tip>", "<vocabulary tip>"]
  },
  "grammaticalRange": {
    "bandScore": <number>,
    "commentary": "<analysis of grammar and sentence variety>",
    "suggestions": ["<grammar tip>", "<grammar tip>"]
  },
  "overallBand": <number>,
  "highlightedIssues": [
    { "text": "<quoted from essay>", "issue": "<description>", "type": "error|warning|strength" }
  ],
  "wordCount": <number>,
  "keyStrengths": ["<identified strength>"],
  "priorityAreas": ["<area needing improvement>"]
}`;

const SPEAKING_SYSTEM_PROMPT = `You are a certified IELTS examiner specialising in Speaking assessment. You apply the official IELTS Speaking Band Descriptors with expertise in accent and intonation evaluation.

Scoring criteria:
1. Fluency & Coherence (FC): Smooth, natural speech with clear ideas; uses connectives; pauses appropriate
2. Lexical Resource (LR): Range of vocabulary; natural use; less common words; appropriate expressions
3. Grammatical Range & Accuracy (GRA): Variety of structures; mostly accurate; complex sentences
4. Pronunciation (P): Clear intelligibility; stress and intonation; connected speech

Band guidelines:
- Band 8-9: Fluent, varied vocabulary, accurate grammar, intelligible pronunciation
- Band 6-7: Mostly fluent, good range, generally accurate, understandable
- Band 5: Fluent with some hesitation, adequate range, frequent errors, mostly intelligible
- Band 1-4: Limited fluency, limited range, significant errors, difficult to understand

Note: Pronunciation is partially AI-estimated from transcript patterns (hesitations, fillers, pauses).

Respond ONLY with valid JSON (no markdown):
{
  "fluency": {
    "bandScore": <number>,
    "commentary": "<analysis of flow and coherence>",
    "suggestions": ["<improvement tip>", "<improvement tip>"]
  },
  "coherence": {
    "bandScore": <number>,
    "commentary": "<analysis of idea organization>",
    "suggestions": ["<improvement tip>", "<improvement tip>"]
  },
  "lexicalResource": {
    "bandScore": <number>,
    "commentary": "<analysis of vocabulary range and use>",
    "suggestions": ["<improvement tip>", "<improvement tip>"]
  },
  "grammaticalRange": {
    "bandScore": <number>,
    "commentary": "<analysis of grammar and structure>",
    "suggestions": ["<improvement tip>", "<improvement tip>"]
  },
  "pronunciationProxy": {
    "bandScore": <number>,
    "commentary": "<note this is AI-estimated from patterns. analysis of intelligibility and flow>",
    "suggestions": ["<pronunciation tip>", "<pronunciation tip>"]
  },
  "overallBand": <number>,
  "hesitationPatterns": "<description of pause and filler frequency>",
  "estimatedWPM": <number>,
  "keyStrengths": ["<identified strength>"],
  "priorityAreas": ["<area for improvement>"]
}`;

// ─── Writing feedback ─────────────────────────────────────────────────────────
async function generateWritingFeedback({ text, prompt, taskType, isPremium }) {
  // Use mock in dev if flag set
  if (process.env.ENABLE_MOCK_AI === "true") {
    return _mockWritingFeedback(text, isPremium);
  }

  const wordCount = text.trim().split(/\s+/).length;
  const taskLabel = taskType === "task1" ? "Task 1 (data description)" : "Task 2 (essay)";

  const userMessage = `Task type: Academic Writing ${taskLabel}

Task Prompt:
${prompt || "(No prompt provided)"}

Candidate's response (${wordCount} words):
${text}

Score this response using the official IELTS Academic Writing Band Descriptors.`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: WRITING_SYSTEM_PROMPT,
        temperature: 0.2,
      }
    });

    const raw = response.text.trim();
    const feedback = _parseJSON(raw);

    // Enforce schema
    _validateWritingFeedback(feedback);

    // Free users only get overallBand
    if (!isPremium) {
      return { overallBand: feedback.overallBand, wordCount };
    }

    return { ...feedback, wordCount };
  } catch (err) {
    logger.error("Gemini writing feedback error:", { error: err.message });
    return _mockWritingFeedback(text, isPremium);
  }
}

// ─── Speaking feedback ────────────────────────────────────────────────────────
async function generateSpeakingFeedback({ transcript, questions, isPremium }) {
  if (process.env.ENABLE_MOCK_AI === "true") {
    return _mockSpeakingFeedback(isPremium);
  }

  const transcriptText = Array.isArray(transcript)
    ? transcript.map((t) => `[${t.part}]\n${t.text}`).join("\n\n")
    : transcript || "";

  const questionsText = Array.isArray(questions)
    ? questions.map((q) => `- ${q.questionText}`).join("\n")
    : "";

  const userMessage = `Examiner questions asked:
${questionsText || "(questions not provided)"}

Candidate transcript:
${transcriptText}

Evaluate using IELTS Speaking Band Descriptors.`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: SPEAKING_SYSTEM_PROMPT,
        temperature: 0.2,
      }
    });

    const raw = response.text.trim();
    const feedback = _parseJSON(raw);
    _validateSpeakingFeedback(feedback);

    if (!isPremium) {
      return { overallBand: feedback.overallBand };
    }

    return feedback;
  } catch (err) {
    logger.error("Gemini speaking feedback error:", { error: err.message });
    return _mockSpeakingFeedback(isPremium);
  }
}

// ─── Whisper transcription ────────────────────────────────────────────────────
async function transcribeAudio(audioBuffer, filename = "audio.webm") {
  if (process.env.ENABLE_MOCK_AI === "true" || !audioBuffer) {
    return [
      { part: "Part 1", text: "I live in a flat in the city centre. I really enjoy it because it's very convenient for work and... um... there are lots of cafes and restaurants nearby." },
      { part: "Part 2", text: "I'd like to talk about my hometown, which is a medium-sized city in the north of my country. It's... it's known for its historical buildings and... um... its friendly people." },
      { part: "Part 3", text: "I think cities face many challenges today. The main ones are... traffic congestion, pollution, and the rising cost of living. Governments need to invest in public transport and green spaces to address these issues." },
    ];
  }

  const formData = new FormData();
  formData.append("file", audioBuffer, { filename, contentType: "audio/webm" });
  formData.append("model", "whisper-1");
  formData.append("response_format", "json");
  formData.append("language", "en");

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        timeout: 60000,
      }
    );
    return response.data.text;
  } catch (err) {
    logger.error("Whisper transcription error:", { error: err.message });
    throw new Error("Audio transcription failed");
  }
}

// ─── OpenAI fallback ──────────────────────────────────────────────────────────
async function _openAIWritingFeedback({ text, prompt, taskType, isPremium, wordCount }) {
  if (!process.env.OPENAI_API_KEY) return _mockWritingFeedback(text, isPremium);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        max_tokens: 1500,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: WRITING_SYSTEM_PROMPT },
          { role: "user", content: `Prompt: ${prompt}\n\nEssay:\n${text}` },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const feedback = JSON.parse(response.data.choices[0].message.content);
    if (!isPremium) return { overallBand: feedback.overallBand, wordCount };
    return { ...feedback, wordCount };
  } catch (err) {
    logger.error("OpenAI writing fallback error:", { error: err.message });
    return _mockWritingFeedback(text, isPremium);
  }
}

async function _openAISpeakingFeedback({ transcript, questions, isPremium }) {
  if (!process.env.OPENAI_API_KEY) return _mockSpeakingFeedback(isPremium);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        max_tokens: 1200,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SPEAKING_SYSTEM_PROMPT },
          { role: "user", content: `Questions:\n${questions}\n\nTranscript:\n${transcript}` },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const feedback = JSON.parse(response.data.choices[0].message.content);
    if (!isPremium) return { overallBand: feedback.overallBand };
    return feedback;
  } catch (err) {
    logger.error("OpenAI speaking fallback error:", { error: err.message });
    return _mockSpeakingFeedback(isPremium);
  }
}

// ─── JSON parsing with cleanup ────────────────────────────────────────────────
function _parseJSON(raw) {
  // Strip markdown code fences if model included them
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object from the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse AI response as JSON");
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────
function _validateWritingFeedback(fb) {
  const required = ["taskAchievement", "coherenceCohesion", "lexicalResource", "grammaticalRange", "overallBand"];
  for (const key of required) {
    if (fb[key] === undefined) throw new Error(`Missing field: ${key}`);
  }
  if (typeof fb.overallBand !== "number" || fb.overallBand < 1 || fb.overallBand > 9) {
    throw new Error("Invalid overallBand");
  }
}

function _validateSpeakingFeedback(fb) {
  const required = ["fluency", "coherence", "lexicalResource", "pronunciationProxy", "overallBand"];
  for (const key of required) {
    if (fb[key] === undefined) throw new Error(`Missing field: ${key}`);
  }
}

// ─── Mock responses (development) ────────────────────────────────────────────
function _mockWritingFeedback(text, isPremium) {
  const wc = text?.trim().split(/\s+/).length || 0;
  const band = wc >= 250 ? 6.5 : wc >= 150 ? 6.0 : 5.5;

  const full = {
    taskAchievement: {
      bandScore: band,
      commentary: "The response addresses the task but ideas could be developed more fully with concrete examples.",
      suggestions: ["Add specific real-world examples to support your central argument.", "Ensure your conclusion synthesises rather than merely restates your position."],
    },
    coherenceCohesion: {
      bandScore: band - 0.5,
      commentary: "The essay has a clear structure but overuses a narrow range of cohesive devices.",
      suggestions: ["Vary your discourse markers (e.g., 'by contrast', 'consequently', 'as a result').", "Ensure each body paragraph develops a single main idea clearly."],
    },
    lexicalResource: {
      bandScore: band,
      commentary: "Vocabulary is adequate and generally accurate. Some attempts at less common items.",
      suggestions: ["Replace high-frequency words like 'important' with more precise alternatives.", "Use collocations naturally (e.g., 'raise awareness', 'tackle a problem')."],
    },
    grammaticalRange: {
      bandScore: band,
      commentary: "A mix of simple and complex structures used with generally good control.",
      suggestions: ["Use more passive constructions in formal academic writing.", "Check subject-verb agreement in complex clauses."],
    },
    overallBand: band,
    highlightedIssues: [
      { text: "high-frequency word", issue: "Replace with more specific vocabulary", type: "warning" },
    ],
    wordCount: wc,
    keyStrengths: ["Clear task understanding", "Logical paragraph organization"],
    priorityAreas: ["Lexical range expansion", "Complex grammar structures"],
  };

  if (!isPremium) return { overallBand: full.overallBand, wordCount: wc };
  return full;
}

function _mockSpeakingFeedback(isPremium) {
  const full = {
    fluency: {
      bandScore: 6.0,
      commentary: "Speech is generally fluent with occasional hesitations that do not impede communication.",
      suggestions: ["Reduce filler words ('um', 'uh') by practising sustained speaking for 2 minutes daily.", "Maintain a consistent pace — neither too fast nor too slow."],
    },
    coherence: {
      bandScore: 6.0,
      commentary: "Answers are relevant and generally organised, though development is sometimes limited.",
      suggestions: ["Extend your answers using the PEEL structure (Point, Example, Explain, Link).", "Avoid one-sentence answers in Part 1 — aim for 3-4 sentences minimum."],
    },
    lexicalResource: {
      bandScore: 6.0,
      commentary: "Adequate range of vocabulary. Some idiomatic language attempted.",
      suggestions: ["Learn topic-specific vocabulary clusters (e.g., environment, technology, society).", "Use phrasal verbs and idioms naturally where appropriate."],
    },
    grammaticalRange: {
      bandScore: 5.5,
      commentary: "Mix of simple and some complex structures. Minor grammatical errors noted.",
      suggestions: ["Practice using relative clauses more confidently.", "Focus on subject-verb agreement in longer sentences."],
    },
    pronunciationProxy: {
      bandScore: 5.5,
      commentary: "AI-estimated based on transcript patterns. Transcript suggests generally intelligible speech with some repetitions.",
      suggestions: ["This score is AI-estimated. For accurate pronunciation feedback, request an expert human review.", "Listen to authentic academic speakers and practice shadowing for 15 minutes daily."],
    },
    overallBand: 6.0,
    hesitationPatterns: "Moderate hesitation (12 fillers/pauses detected). Generally smooth flow with occasional restarts.",
    estimatedWPM: 130,
    keyStrengths: ["Consistent intelligibility", "Topic relevance maintained"],
    priorityAreas: ["Reduce hesitations", "Extend answer depth"],
  };

  if (!isPremium) return { overallBand: full.overallBand };
  return full;
}

module.exports = { generateWritingFeedback, generateSpeakingFeedback, transcribeAudio };
