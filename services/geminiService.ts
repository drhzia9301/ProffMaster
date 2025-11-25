import { GoogleGenAI } from "@google/genai";
import { Question } from '../types';
import { getApiKey } from './apiKeyService';

const getAIClient = () => {
  // Try to get API key from localStorage first, then fallback to environment variable
  let apiKey = getApiKey();
  let source = 'localStorage';

  // Fallback to environment variable for backward compatibility
  if (!apiKey) {
    apiKey = process.env.API_KEY || null;
    source = 'environment';
  }

  if (!apiKey) {
    console.warn("API Key not found. Please configure it in Settings.");
    return null;
  }

  // Basic validation
  if (apiKey.length < 10) {
    console.error(`Invalid API Key found in ${source}: Key is too short.`);
    return null;
  }

  console.log(`Gemini Client initialized with key from ${source}`);
  return new GoogleGenAI({ apiKey });
};

export const getExplanationFromAI = async (question: Question, selectedOption: string) => {
  const ai = getAIClient();
  if (!ai) return "AI Configuration missing. Please set API Key.";

  try {
    const prompt = `
      Context: Medical Student Exam Preparation (MBBS).
      Question: ${question.text}
      Options: ${question.options.join(', ')}
      Correct Answer: ${question.options[question.correctIndex]}
      User Selected: ${selectedOption}

      Task: Explain briefly why the correct answer is correct and why the user's selection (if wrong) is incorrect.
      Keep it concise (max 3 sentences). Focus on the clinical concept.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to fetch AI explanation. Please try again later.";
  }
};

export const getHintFromAI = async (question: Question) => {
  const ai = getAIClient();
  if (!ai) return "AI Configuration missing.";

  try {
    const prompt = `
      Context: Medical Student Exam Preparation (MBBS).
      Question: ${question.text}
      Options: ${question.options.join(', ')}
      
      Task: Provide a subtle hint to help the student answer the question.
      Do NOT reveal the answer.
      Do NOT mention the option letter (A, B, C..).
      Focus on the underlying mechanism or pathology.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No hint available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to fetch hint.";
  }
};

export const getHighYieldPointsFromAI = async (question: Question) => {
  const ai = getAIClient();
  if (!ai) return "AI Configuration missing.";

  try {
    const prompt = `
      Context: Medical Student Exam Preparation (MBBS).
      Question: ${question.text}
      Options: ${question.options.join(', ')}
      Correct Answer: ${question.options[question.correctIndex]}
      
      Task: Generate 4-5 "High Yield Points" related to this question's topic.
      These should be key facts, associations, or clinical pearls that are frequently tested.
      Format as a bulleted list.
      Keep each point concise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No high yield points available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to fetch high yield points.";
  }
};

export const getSessionAnalysisFromAI = async (data: {
  score: number;
  total: number;
  subject: string;
  mistakes: { question: string; selected: string; correct: string }[];
}) => {
  const ai = getAIClient();
  if (!ai) return "AI Configuration missing.";

  try {
    const prompt = `
      Context: Medical Student Exam Preparation (MBBS).
      Session Summary:
      - Subject: ${data.subject}
      - Score: ${data.score}/${data.total}
      - Mistakes:
      ${data.mistakes.map(m => `- Q: ${m.question}\n  Selected: ${m.selected} (Wrong), Correct: ${m.correct}`).join('\n')}

      Task: Analyze the student's performance.
      1. Identify potential knowledge gaps based on the mistakes.
      2. Provide specific advice on what to review.
      3. Give a brief encouraging remark.
      Keep it constructive and under 150 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to analyze session.";
  }
};
