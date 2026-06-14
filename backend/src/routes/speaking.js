const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const axios = require('axios');

const SYSTEM_PROMPT = `You are a strict, professional IELTS Speaking Examiner. Your name is Kiki Baessell, and you are a professional British resident. You must strictly adhere to the following rules:
1. NEVER act like a helpful AI assistant. Act like a human evaluator conducting a formal exam.
2. KEEP YOUR TURNS UNDER 10 SECONDS. Ask the question and immediately stop speaking.
3. NEVER express opinions, praise the candidate, or say "That's a great answer!" or "Interesting!".
4. Use neutral transitions ONLY, such as: "Thank you. Let's move on to...", "Why is that?", or "Can you elaborate?"
5. In Part 3, if the candidate gives a superficial or overly short answer, gracefully interrupt them or ask probing follow-up questions like "But why do you think some people disagree with that?"
6. Follow the structural instructions provided to you by the hidden system control messages during the test.
7. Briefly introduce yourself as Kiki Baessell at the very beginning of the test.`;

// @route   GET /api/speaking/realtime-session
// @desc    Get OpenAI Realtime Ephemeral Token
// @access  Private
router.get('/realtime-session', auth, async (req, res) => {
  try {
    // Check limits before issuing token
    const access = req.user.canAccess("speaking");
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: `Daily speaking limit reached (${access.used}/${access.limit})`,
        upgradeRequired: true
      });
    }

    const response = await axios.post(
      "https://api.openai.com/v1/realtime/sessions",
      {
        model: "gpt-4o-realtime-preview-2024-12-17",
        modalities: ["audio", "text"],
        instructions: SYSTEM_PROMPT,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      client_secret: response.data.client_secret.value
    });
  } catch (error) {
    console.error('Error fetching realtime session:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message || 'Server error' });
  }
});

// @route   POST /api/speaking/chat
// @desc    Process IELTS conversation turn via Gemini API
// @access  Private
router.post('/chat', auth, async (req, res) => {
  try {
    const { transcript, currentPart, questionData, audioBase64 } = req.body;
    
    // Check limits
    const access = req.user.canAccess("speaking");
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: `Daily speaking limit reached (${access.used}/${access.limit})` });
    }

    const { GoogleGenAI } = require('@google/genai');
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured in .env' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Construct conversation history for Gemini
    let contents = transcript.map(t => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: t.text }]
    }));
    
    if (audioBase64) {
      contents.push({
        role: 'user',
        parts: [
          { inlineData: { data: audioBase64, mimeType: 'audio/webm' } },
          { text: "Listen to the audio recording of my response." }
        ]
      });
    } else if (contents.length === 0) {
       contents.push({ role: 'user', parts: [{ text: 'The candidate has entered the room. Greet them strictly.' }] });
    } else {
       // fallback for forced transitions or text-only prompts
       contents.push({ role: 'user', parts: [{ text: 'Please proceed to the next part.' }] });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT + `\n\nCURRENT TEST CONTEXT:\n- Current Phase: ${currentPart}\n- Candidate Info/Questions to cover: ${JSON.stringify(questionData)}\n\nYou must respond in JSON format with exactly two string fields:\n1. "transcription": The exact words the candidate just spoke in the audio (or empty string if no audio or silence).\n2. "examinerResponse": EXACTLY what you (the examiner) should say next, and nothing else. Do not output any thinking or meta-text.`,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text.trim();
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch(e) {
      // Fallback if model fails strict JSON
      resultJson = { transcription: "", examinerResponse: resultText };
    }

    res.json({ success: true, transcription: resultJson.transcription || "", text: resultJson.examinerResponse || "" });
  } catch (error) {
    console.error('Error fetching Gemini response:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;
