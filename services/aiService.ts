import { Question } from "../types";
import { getApiKey, hasApiKey } from "./apiKeyService";
import { dbService } from "./databaseService";

// Google Gemini API configuration - Models in priority order for fallback
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite", // Primary: 10 RPM, 250K TPM - fastest, good quality
  "gemini-2.5-flash", // Fallback 1: 5 RPM, 250K TPM - higher quality
  "gemma-3-27b", // Fallback 2: 30 RPM, 15K TPM - highest RPM
] as const;

// Track which model is currently being used
let currentModelIndex = 0;
const getGeminiApiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Export model information for display in settings
export const getAIModelName = (): string => GEMINI_MODELS[currentModelIndex];
export const getAIProvider = (): string => "Google Gemini";
export const getAIModelDisplayName = (): string => {
  const model = GEMINI_MODELS[currentModelIndex];
  if (model === "gemini-2.5-flash-lite") return "Gemini 2.5 Flash Lite";
  if (model === "gemini-2.5-flash") return "Gemini 2.5 Flash";
  if (model === "gemma-3-27b") return "Gemma 3 27B";
  return model;
};

// Track rate limit errors per model
const modelErrors: Record<string, number> = {};
const ERROR_COOLDOWN = 60000; // 60 seconds cooldown per model before retry

/**
 * Sleep helper function
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper function to fix truncated JSON responses from AI
 * Attempts to extract complete question objects from a truncated array
 */
const tryFixTruncatedJson = (jsonText: string): string | null => {
  try {
    // Find the start of the array
    const arrayStart = jsonText.indexOf("[");
    if (arrayStart === -1) return null;

    // Find all complete objects by looking for }, followed by ] or ,{
    let bracketCount = 0;
    let inString = false;
    let lastCompleteObjectEnd = -1;
    let escapeNext = false;

    for (let i = arrayStart; i < jsonText.length; i++) {
      const char = jsonText[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "{") bracketCount++;
      if (char === "}") {
        bracketCount--;
        if (bracketCount === 1) {
          // Found a complete object at the top level of the array
          lastCompleteObjectEnd = i;
        }
      }
    }

    if (lastCompleteObjectEnd > arrayStart) {
      // Construct a valid JSON array with complete objects
      const fixedJson =
        jsonText.substring(arrayStart, lastCompleteObjectEnd + 1) + "]";
      // Verify it parses
      JSON.parse(fixedJson);
      return fixedJson;
    }

    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Call Google Gemini API with a specific model
 */
const callGeminiAPIWithModel = async (
  prompt: string,
  model: string,
  maxTokens: number = 2048
): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  const apiUrl = getGeminiApiUrl(model);
  console.log(`Calling Gemini API with model: ${model}`);

  const response = await fetch(`${apiUrl}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 429) {
      modelErrors[model] = Date.now();
      throw new Error("RATE_LIMIT");
    }
    if (response.status === 400 && error.error?.message?.includes("API key")) {
      throw new Error(
        "Invalid API key. Please check your Gemini API key in Settings."
      );
    }
    if (response.status === 403) {
      throw new Error(
        "Invalid API key. Please check your Gemini API key in Settings."
      );
    }
    throw new Error(
      error.error?.message || `Gemini API error: ${response.status}`
    );
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

/**
 * Call Gemini API with automatic fallback to other models
 */
const callGeminiAPI = async (
  prompt: string,
  maxTokens: number = 2048
): Promise<string> => {
  const now = Date.now();

  // Try each model in priority order
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    const lastError = modelErrors[model] || 0;

    // Skip this model if it's in cooldown
    if (now - lastError < ERROR_COOLDOWN) {
      console.log(`Model ${model} is in cooldown, skipping...`);
      continue;
    }

    try {
      currentModelIndex = i;
      const result = await callGeminiAPIWithModel(prompt, model, maxTokens);
      console.log(`Successfully used model: ${model}`);
      return result;
    } catch (error: any) {
      console.warn(`Model ${model} failed:`, error.message);

      // If it's not a rate limit error, rethrow immediately
      if (!error.message?.includes("RATE_LIMIT")) {
        throw error;
      }

      // Rate limit - try next model
      console.log(`Rate limited on ${model}, trying next model...`);
    }
  }

  // All models exhausted
  throw new Error("RATE_LIMIT");
};

/**
 * Call AI (Gemini with automatic model fallback)
 * @param prompt The prompt to send
 * @param maxTokens Maximum tokens for response
 */
const callAI = async (
  prompt: string,
  maxTokens: number = 2048
): Promise<string> => {
  // Check if API key is configured
  if (!hasApiKey()) {
    throw new Error(
      "No API key configured. Please add your Gemini API key in Settings."
    );
  }

  const now = Date.now();

  // Check if ALL models are in cooldown
  const allModelsInCooldown = GEMINI_MODELS.every((model) => {
    const lastError = modelErrors[model] || 0;
    return now - lastError < ERROR_COOLDOWN;
  });

  if (allModelsInCooldown) {
    // Find the model that will be available soonest
    let soonestAvailable = Infinity;
    for (const model of GEMINI_MODELS) {
      const lastError = modelErrors[model] || 0;
      const availableIn = ERROR_COOLDOWN - (now - lastError);
      if (availableIn < soonestAvailable) {
        soonestAvailable = availableIn;
      }
    }
    const remainingSeconds = Math.ceil(soonestAvailable / 1000);
    throw new Error(
      `All AI models are rate limited. Please wait ${remainingSeconds} seconds before trying again.`
    );
  }

  try {
    console.log("Calling Gemini API with fallback system...");
    return await callGeminiAPI(prompt, maxTokens);
  } catch (error: any) {
    console.error("Gemini API failed:", error.message);

    // If it's a rate limit error, provide helpful message
    if (
      error.message?.includes("RATE_LIMIT") ||
      error.message?.includes("429")
    ) {
      throw new Error(
        "All AI models rate limited. Please wait a moment and try again."
      );
    }

    throw new Error(
      "AI service temporarily unavailable. Please try again later."
    );
  }
};

export const getExplanationFromAI = async (
  question: Question,
  selectedOption: string
) => {
  try {
    const prompt = `
      Context: Medical Student Exam Preparation (MBBS).
      Question: ${question.text}
      Options: ${question.options.join(", ")}
      Correct Answer: ${question.options[question.correctIndex]}
      User Selected: ${selectedOption}

      Task: Explain briefly why the correct answer is correct and why the user's selection (if wrong) is incorrect.
      Keep it concise (max 3 sentences). Focus on the clinical concept.
    `;

    return (await callAI(prompt)) || "No explanation available.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to fetch AI explanation. Please try again later.";
  }
};

export const getHintFromAI = async (question: Question) => {
  try {
    const prompt = `
      Context: Medical Student Exam Preparation (MBBS).
      Question: ${question.text}
      Options: ${question.options.join(", ")}
      
      Task: Provide a subtle hint to help the student answer the question.
      Do NOT reveal the answer.
      Do NOT mention the option letter (A, B, C..).
      Focus on the underlying mechanism or pathology.
    `;

    return (await callAI(prompt)) || "No hint available.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to fetch hint.";
  }
};

export const getHighYieldPointsFromAI = async (question: Question) => {
  try {
    const prompt = `
      Context: Medical Student Exam Preparation (MBBS).
      Question: ${question.text}
      Options: ${question.options.join(", ")}
      Correct Answer: ${question.options[question.correctIndex]}
      
      Task: Generate 4-5 "High Yield Points" related to this question's topic.
      These should be key facts, associations, or clinical pearls that are frequently tested.
      Format as a bulleted list.
      Keep each point concise.
    `;

    return (await callAI(prompt)) || "No high yield points available.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to fetch high yield points.";
  }
};

export const getSessionAnalysisFromAI = async (data: {
  score: number;
  total: number;
  subject: string;
  mistakes: { question: string; selected: string; correct: string }[];
}) => {
  try {
    const prompt = `
      Context: Medical Student Exam Preparation (MBBS).
      Session Summary:
      - Subject: ${data.subject}
      - Score: ${data.score}/${data.total}
      - Mistakes:
      ${data.mistakes
        .map(
          (m) =>
            `- Q: ${m.question}\n  Selected: ${m.selected} (Wrong), Correct: ${m.correct}`
        )
        .join("\n")}

      Task: Analyze the student's performance.
      1. Identify potential knowledge gaps based on the mistakes.
      2. Provide specific advice on what to review.
      3. Give a brief encouraging remark.
      Keep it constructive and under 150 words.
    `;

    return (await callAI(prompt)) || "No analysis available.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to analyze session.";
  }
};

export const generateStudyNotes = async (
  questions: Question[],
  mode: "concise" | "detailed" = "concise",
  customTitle?: string
): Promise<string> => {
  try {
    // Limit context to avoid token limits (e.g., first 50 questions)
    const contextQuestions = questions
      .slice(0, 50)
      .map(
        (q) =>
          `- Topic: ${q.tags.join(", ")}\n  Question: ${
            q.text
          }\n  Correct Answer: ${q.options[q.correctIndex]}`
      )
      .join("\n");

    let taskDescription = "";
    if (mode === "concise") {
      taskDescription = `
      Task: Create "High Yield Concise Study Notes".
      1. Group by major topics.
      2. For each topic, provide a BIG HEADING (## Topic Name).
      3. Under each heading, list HIGH-YIELD POINTERS and CLINICAL PEARLS.
      4. Format:
         - Use **Bold** for key terms.
         - Use bullet points (-) for facts.
      5. Keep it very concise, like "Rapid Review" notes.
      `;
    } else {
      taskDescription = `
      Task: Create "Detailed Study Notes" with in-depth explanations.
      1. Group by major topics.
      2. For each topic, provide a BIG HEADING (## Topic Name).
      3. Under each heading, provide a COMPREHENSIVE EXPLANATION of the concepts tested.
      4. Explain the "Why" and "How" (pathophysiology, mechanism of action, etc.).
      5. Format:
         - Use **Bold** for key terms.
         - Use *Italics* for emphasis.
         - Use paragraphs for explanations.
      `;
    }

    const prompt = `
      Context: Medical Student Exam Preparation (MBBS).
      Source Material: The following questions were just attempted by the student.
      
      ${contextQuestions}

      ${taskDescription}

      Structure the notes beautifully using Markdown.
      Do not just list the questions. Synthesize the knowledge.
    `;

    return (await callAI(prompt)) || "Failed to generate notes.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to generate notes due to an error.";
  }
};

export const generateSimilarQuestions = async (
  sessionQuestions: Question[],
  count: number = 10,
  onProgress?: (msg: string) => void
): Promise<Question[]> => {
  try {
    onProgress?.("Analyzing session topics...");

    // Extract topics and subjects from session questions
    const topics = Array.from(
      new Set(sessionQuestions.flatMap((q) => q.tags || []))
    );
    const subjects = Array.from(
      new Set(sessionQuestions.map((q) => q.subject))
    );
    const difficulties = Array.from(
      new Set(sessionQuestions.map((q) => q.difficulty))
    );

    // Extract TOPIC KEYWORDS only (not full questions to prevent copying)
    // Get key medical terms from each question for topic identification
    const topicHints = sessionQuestions
      .map((q) => {
        // Extract first sentence or up to 80 chars as a topic hint
        const firstSentence = q.text.split(/[.?!]/)[0].substring(0, 80);
        return firstSentence;
      })
      .slice(0, 5); // Only use first 5 as hints

    onProgress?.(`Generating ${count} questions on session topics...`);

    const prompt = `
      Context: Medical Student Exam Preparation (MBBS) - KMU Prof Exam Style.
      
      📚 SESSION TOPICS COVERED:
      The student just studied questions about these subjects/topics:
      ${topics.map((t) => `• ${t}`).join("\n")}
      
      Subject areas: ${subjects.join(", ")}
      
      Topic hints from session (for context only):
      ${topicHints.map((h, i) => `${i + 1}. ${h}...`).join("\n")}
      
      ---
      
      🎯 YOUR TASK:
      Generate ${count} NEW questions that test the SAME MEDICAL TOPICS/CONCEPTS but with COMPLETELY DIFFERENT:
      - Clinical scenarios
      - Patient presentations
      - Question stems
      - Case details (age, gender, symptoms)
      
      ⚠️ CRITICAL RULES:
      1. SAME TOPICS - Questions must test the same diseases/conditions/concepts from the session
      2. DIFFERENT SCENARIOS - Use completely different clinical vignettes
      3. NO COPYING - Do NOT reuse any question text, patient descriptions, or specific details from the session
      4. VARY THE ANGLE - If session asked about diagnosis, you can ask about treatment, pathophysiology, or complications
      
      Example of what we want:
      - Session had: "A child with gray pharyngeal membrane..." (testing Diphtheria diagnosis)
      - You generate: "An unvaccinated child develops bull neck swelling..." (testing Diphtheria complication)
      
      Example of what we DON'T want:
      - Session had: "A child with gray pharyngeal membrane..."
      - You generate: "A child with gray pharyngeal membrane..." (WRONG - same scenario!)
      
      Format: JSON Array of EXACTLY ${count} objects:
      [
        {
          "id": "unique_id",
          "text": "NEW clinical scenario question here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0,
          "subject": "${subjects[0] || "General"}",
          "tags": ["topic from session"],
          "difficulty": "${difficulties[0] || "Medium"}",
          "explanation": "Brief explanation."
        }
      ]
      
      Return ONLY the JSON array, no markdown.
    `;

    const text = await callAI(prompt);
    if (!text) return [];

    // Try to parse JSON - handle potential markdown wrapping
    let jsonText = text;
    if (text.includes("```json")) {
      jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (text.includes("```")) {
      jsonText = text.replace(/```\n?/g, "");
    }

    let questions = JSON.parse(jsonText.trim()) as Question[];

    onProgress?.("Questions generated successfully!");
    return questions.map((q, i) => ({
      ...q,
      id: `ai_similar_${Date.now()}_${i}`,
      subject: q.subject || (subjects[0] as any),
    }));
  } catch (error) {
    console.error("AI Error generating similar questions:", error);
    return [];
  }
};

const BLOCK_DISTRIBUTIONS: Record<string, Record<string, number>> = {
  "Block J": {
    Pharmacology: 20,
    Pathology: 22,
    "Forensic Medicine": 18,
    "Community Medicine": 27,
    PRIME: 2,
    Medicine: 11,
    Psychiatry: 9,
    Neurosurgery: 2,
    Pediatrics: 5,
    Anesthesia: 3,
    "Family Medicine": 1,
  },
  "Block K": {
    Pharmacology: 16,
    Pathology: 41,
    "Forensic Medicine": 16,
    "Community Medicine": 18,
    PRIME: 1,
    Medicine: 11,
    Surgery: 12,
    Pediatrics: 3,
    "Family Medicine": 2,
  },
  "Block L": {
    "Community Medicine": 17,
    Pharmacology: 9,
    Pathology: 23,
    "Forensic Medicine": 7,
    Surgery: 9,
    Gynecology: 40,
    Medicine: 10,
    Pediatrics: 3,
    "Family Medicine": 2,
  },
  "Block M1": {
    ENT: 90,
  },
  "Block M2": {
    Ophthalmology: 90,
  },
};

const BLOCK_SYLLABUS_FILES: Record<string, string> = {
  "Block J": "Block_J_syllabus.txt",
  "Block K": "Block_K_syllabus.txt",
  "Block L": "Block_L_syllabus.txt",
  "Block M1": "Block_M1_syllabus.txt",
  "Block M2": "Block_M2_syllabus.txt",
};

export const generateQuiz = async (
  block: string,
  type: "full" | "custom",
  topic?: string,
  count?: number,
  onProgress?: (message: string) => void
): Promise<Question[]> => {
  try {
    // 1. Handle Custom Quiz (Simple Path)
    if (type === "custom") {
      onProgress?.("Loading syllabus...");

      // Load the block syllabus for context
      let syllabusText = "";
      const syllabusFile = BLOCK_SYLLABUS_FILES[block];
      if (syllabusFile) {
        try {
          const response = await fetch(`/assets/${syllabusFile}`);
          if (response.ok) {
            syllabusText = await response.text();
            console.log(`Syllabus loaded, length: ${syllabusText.length}`);
          } else {
            console.warn("Failed to load syllabus file");
          }
        } catch (e) {
          console.warn("Failed to load syllabus:", e);
        }
      }

      onProgress?.("Fetching style examples...");

      // Fetch random questions from DB for style mimicry
      let styleExamples = "";
      try {
        const allLocalQuestions = await dbService.getAllQuestions();
        if (allLocalQuestions.length > 0) {
          // Pick 5 random questions for better style training
          const examples = allLocalQuestions
            .sort(() => 0.5 - Math.random())
            .slice(0, 5)
            .map(
              (q) =>
                `Question: ${q.text}\nOptions:\nA. ${q.options[0]}\nB. ${q.options[1]}\nC. ${q.options[2]}\nD. ${q.options[3]}`
            );

          styleExamples = `
          STYLE REFERENCE - These are REAL KMU Prof exam questions. Match this EXACT style, difficulty, and format:
          
          ${examples.join("\n\n---\n\n")}
          
          KEY STYLE POINTS:
          - Match the clinical vignette style and length
          - Use similar medical terminology level
          - Match the difficulty (Prof exam level)
          `;
        }
      } catch (e) {
        console.warn("Failed to fetch local questions for style mimicry:", e);
      }

      onProgress?.(`Generating ${topic} questions...`);
      const desiredTotal = count || 10;
      const BATCH_SIZE = 20;
      const isLargeRequest = desiredTotal > BATCH_SIZE;

      let allQuestions: Question[] = [];
      const batches = Math.ceil(desiredTotal / BATCH_SIZE);

      for (let i = 0; i < batches; i++) {
        // Enforce rate limit delay between batches
        if (i > 0) {
          const waitTime = 5; // 5 Seconds for Gemini rate limits (15 RPM)
          onProgress?.(
            `Waiting ${waitTime}s for rate limits (Batch ${
              i + 1
            }/${batches})...`
          );
          await sleep(waitTime * 1000);
        }

        const currentBatchSize =
          i === batches - 1 ? desiredTotal - i * BATCH_SIZE : BATCH_SIZE;

        onProgress?.(
          isLargeRequest
            ? `Generating batch ${
                i + 1
              }/${batches} (${currentBatchSize} questions)...`
            : `Generating ${desiredTotal} questions...`
        );

        // Build syllabus context for the prompt
        // Build syllabus context for the prompt
        const syllabusContext = syllabusText
          ? `
          📚 OFFICIAL ${block} SYLLABUS (AUTHORITATIVE SOURCE):
          ${syllabusText.slice(0, 12000)}
          
          🚨 CRITICAL: You MUST generate questions ONLY from the topics covered in this ${block} syllabus above.
          📍 Subject Filter: Focus on "${topic}" content within the ${block} syllabus.
          ⛔ FORBIDDEN: Do NOT generate questions about "${topic}" topics that are NOT covered in the ${block} syllabus.
        `
          : `
          ⚠️ WARNING: No syllabus available for ${block}.
          📍 Generate questions about "${topic}" at the ${block} level, but be conservative and stick to core topics.
        `;

        const prompt = `
          Context: Medical Student Exam Preparation (MBBS) - ${block} - KMU Prof Exam Style.
          
          ${styleExamples}
          
          ${syllabusContext}
          
          🎯 TASK: Generate ${currentBatchSize} questions from the ${block} syllabus content related to "${topic}".
          
          🚨 CRITICAL REQUIREMENTS:
          1. Generate EXACTLY ${currentBatchSize} questions.
          2. SYLLABUS COMPLIANCE: Every question MUST be based on topics explicitly covered in the ${block} syllabus above.
          3. SUBJECT FOCUS: Questions should relate to "${topic}" but ONLY within the scope of the ${block} syllabus.
          4. If the ${block} syllabus doesn't cover certain "${topic}" subtopics, SKIP them entirely.
          5. Each question MUST have an "explanation" field.
          6. Match KMU Prof exam style (clinical vignettes, integrated knowledge).
          7. Questions should test understanding of ${block}-specific content.
          8. 🚫 NEVER mention "${block}", "syllabus", "according to", or any block references in question text or explanations.
          9. Write natural medical questions without referencing curriculum structure.

          ✅ GOOD EXAMPLE: If generating "Pathology" questions for "Block J", only use pathology topics that appear in the Block J syllabus.
          ❌ BAD EXAMPLE: Generating random pathology questions not covered in Block J.

          Format: JSON Array of EXACTLY ${currentBatchSize} objects:
          [
            {
              "id": "unique_id",
              "text": "Clinical vignette question (NO block/syllabus references)",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctIndex": 0,
              "subject": "${topic}", 
              "tags": ["${block}", "${topic}"],
              "difficulty": "Medium",
              "explanation": "Brief medical explanation (1-2 sentences, NO curriculum references)."
            }
          ]
          
          Return ONLY the JSON array, no markdown formatting.
          IMPORTANT: Keep explanations short to avoid truncation.
        `;

        const text = await callAI(prompt, 4096);

        if (!text) {
          console.warn(`Batch ${i + 1} failed to generate text.`);
          continue;
        }

        // Try to parse JSON - handle potential markdown wrapping and truncation
        let jsonText = text;
        if (text.includes("```json")) {
          jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        } else if (text.includes("```")) {
          jsonText = text.replace(/```\n?/g, "");
        }

        // Clean up common JSON issues
        jsonText = jsonText.trim();

        let batchQuestions: Question[] = [];

        // Try to fix truncated JSON by finding the last complete object
        try {
          batchQuestions = JSON.parse(jsonText) as Question[];
        } catch (parseError) {
          console.warn(
            `Batch ${
              i + 1
            } JSON parse failed, attempting to fix truncated response...`
          );

          // Try to find and parse complete questions from potentially truncated JSON
          const fixedJson = tryFixTruncatedJson(jsonText);
          if (fixedJson) {
            batchQuestions = JSON.parse(fixedJson) as Question[];
            console.log(
              `Recovered ${batchQuestions.length} questions from truncated batch response`
            );
          } else {
            console.error(`Batch ${i + 1} failed completely.`);
            // Don't throw entire failure, just continue with what we have so far if possible?
            // Better to try next batch than fail all.
          }
        }

        if (batchQuestions.length > 0) {
          const processedQuestions = batchQuestions.map((q, idx) => ({
            ...q,
            id: `ai_${Date.now()}_${i}_${idx}`,
            subject: block as any,
            tags: [block, topic || block],
          }));
          allQuestions = [...allQuestions, ...processedQuestions];
        }
      }

      // Return whatever we managed to generate
      return allQuestions;
    }

    // 2. Handle Full Paper (Complex Path)
    if (type === "full") {
      console.log(`Starting Full Paper Generation for ${block}...`);
      onProgress?.("Loading syllabus...");

      const syllabusFile = BLOCK_SYLLABUS_FILES[block];
      const distribution = BLOCK_DISTRIBUTIONS[block];

      if (!syllabusFile || !distribution) {
        console.error(`Configuration missing for ${block}`);
        return [];
      }

      // Fetch Syllabus
      let syllabusText = "";
      try {
        const response = await fetch(`/assets/${syllabusFile}`);
        if (response.ok) {
          syllabusText = await response.text();
          console.log("Syllabus loaded, length:", syllabusText.length);
        } else {
          console.warn("Failed to load syllabus file");
        }
      } catch (e) {
        console.error("Error loading syllabus:", e);
      }

      // Fetch style examples from KMU question bank
      onProgress?.("Loading KMU style examples...");
      const allLocalQuestions = await dbService.getAllQuestions();

      // Get style examples from the question bank
      let styleExamples = "";
      try {
        const examples = allLocalQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, 10)
          .map(
            (q) =>
              `Question: ${q.text}\nOptions:\nA. ${q.options[0]}\nB. ${
                q.options[1]
              }\nC. ${q.options[2]}\nD. ${
                q.options[3]
              }\nCorrect: ${String.fromCharCode(65 + q.correctIndex)}`
          );

        styleExamples = `
        STYLE REFERENCE - These are REAL KMU Prof exam questions. Match this EXACT style, difficulty, and clinical vignette format:
        
        ${examples.join("\n\n---\n\n")}
        
        KEY STYLE POINTS TO MATCH:
        - Use similar clinical scenario/vignette length
        - Match the medical terminology level
        - Use similar option formatting and length
        - Match the difficulty level (these are Prof exam level)
        `;
      } catch (e) {
        console.warn("Failed to fetch style examples:", e);
      }

      // Calculate total questions needed
      const totalTarget = Object.values(distribution).reduce(
        (a, b) => a + b,
        0
      );
      const allQuestions: Question[] = [];

      // Generate ONE SUBJECT AT A TIME for better focus and consistency
      const subjects = Object.entries(distribution);
      let subjectIndex = 0;

      // Build full distribution text for context
      const distributionText = Object.entries(distribution)
        .map(([subject, count]) => `- ${subject}: ${count} questions`)
        .join("\n");

      for (const [subject, subjectCount] of subjects) {
        subjectIndex++;

        // Skip if this subject needs 0 questions
        if (subjectCount === 0) continue;

        const progressPercent = Math.round(
          (allQuestions.length / totalTarget) * 100
        );
        onProgress?.(
          `Generating ${subject} (${subjectIndex}/${subjects.length})... ${progressPercent}%`
        );
        console.log(
          `[Subject ${subjectIndex}/${subjects.length}] Generating ${subjectCount} questions for ${subject} in ${block}`
        );

        // Split large subjects into batches to avoid JSON truncation
        const BATCH_SIZE = 15;
        const numBatches = Math.ceil(subjectCount / BATCH_SIZE);
        const subjectQuestions: Question[] = [];

        for (let batchNum = 1; batchNum <= numBatches; batchNum++) {
          const questionsGenerated = subjectQuestions.length;
          const questionsRemaining = subjectCount - questionsGenerated;
          const batchQuestionCount = Math.min(BATCH_SIZE, questionsRemaining);

          if (numBatches > 1) {
            onProgress?.(
              `Generating ${subject} batch ${batchNum}/${numBatches} (${batchQuestionCount} questions)...`
            );
            console.log(
              `  [Batch ${batchNum}/${numBatches}] Generating ${batchQuestionCount} questions for ${subject}`
            );
          }

          const prompt = `
            Context: Medical Student Exam Preparation (MBBS) - ${block} - KMU Prof Exam Style.
            
            ${styleExamples}
            
            Reference Syllabus:
            ${syllabusText.slice(0, 10000)}
            
            FULL EXAM DISTRIBUTION (for context):
            ${distributionText}
            
            ⚠️⚠️⚠️ THIS SUBJECT REQUIREMENT ⚠️⚠️⚠️
            Generate EXACTLY ${batchQuestionCount} questions for the subject: ${subject}
            ${
              numBatches > 1
                ? `(Batch ${batchNum}/${numBatches} for this subject)`
                : ""
            }
            
            CRITICAL REQUIREMENTS:
            1. ⚠️ Generate EXACTLY ${batchQuestionCount} questions total - THIS IS MANDATORY.
            2. ALL questions must be from ${subject} ONLY.
            3. Each question MUST have an "explanation" field.
            4. MATCH THE KMU STYLE shown in examples.
            5. Make questions unique and clinically relevant.
            6. Focus on ${subject} topics from the ${block} syllabus.
            7. 🚫 NEVER mention "${block}", "syllabus", "according to", or any block references in question text or explanations.
            8. Write natural medical questions without referencing curriculum structure.
            
            Format: JSON Array of EXACTLY ${batchQuestionCount} objects:
            [
              {
                \"id\": \"unique_id\",
                \"text\": \"Clinical vignette question (NO block/syllabus references)\",
                \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],
                \"correctIndex\": 0,
                \"subject\": \"${subject}\",
                \"tags\": [\"${block}\", \"${subject}\"],
                \"difficulty\": \"Medium\",
                \"explanation\": \"Clear medical explanation (NO curriculum references).\"
              }
            ]
            
            Return ONLY the JSON array, no markdown formatting.
          `;

          try {
            // Retry logic with longer waits for rate limits
            let retries = 0;
            const maxRetries = 5;
            let text = "";

            while (retries < maxRetries) {
              try {
                text = await callAI(prompt, 4096);
                break;
              } catch (err: any) {
                if (
                  err.message?.includes("rate") ||
                  err.message?.includes("RATE_LIMIT") ||
                  err.message?.includes("429")
                ) {
                  retries++;
                  if (retries < maxRetries) {
                    // Longer waits: 30s, 60s, 90s, 120s
                    const waitTime = Math.min(retries * 30000, 120000);
                    console.log(
                      `Rate limited, waiting ${
                        waitTime / 1000
                      }s before retry ${retries}/${maxRetries}...`
                    );
                    onProgress?.(
                      `⏳ Rate limited, waiting ${
                        waitTime / 1000
                      }s... (${retries}/${maxRetries})`
                    );
                    await sleep(waitTime);
                  } else {
                    console.error(
                      `Max retries reached for ${subject} batch ${batchNum}, skipping this batch`
                    );
                    throw err;
                  }
                } else {
                  throw err;
                }
              }
            }

            if (text) {
              onProgress?.(`Parsing ${subject} batch ${batchNum}...`);

              // Clean JSON
              let jsonText = text;
              if (text.includes("```json")) {
                jsonText = text
                  .replace(/```json\n?/g, "")
                  .replace(/```\n?/g, "");
              } else if (text.includes("```")) {
                jsonText = text.replace(/```\n?/g, "");
              }

              // Parse with fallback
              let batchQuestions: Question[];
              try {
                batchQuestions = JSON.parse(jsonText.trim()) as Question[];
              } catch (parseErr) {
                console.warn(
                  `JSON parse failed for ${subject} batch ${batchNum}, trying truncation fix...`
                );
                const fixedJson = tryFixTruncatedJson(jsonText);
                if (fixedJson) {
                  batchQuestions = JSON.parse(fixedJson) as Question[];
                } else {
                  console.error("Parse error:", parseErr);
                  throw new Error(
                    `Failed to parse ${subject} batch ${batchNum} questions. Please try again.`
                  );
                }
              }

              // Validate and ensure correct subject assignment
              const validQuestions = batchQuestions.map((q) => ({
                ...q,
                subject: subject as any,
                tags: [block, subject],
                explanation:
                  q.explanation ||
                  `The correct answer is ${q.options[q.correctIndex]}.`,
              }));

              subjectQuestions.push(...validQuestions);
              console.log(
                `  ✓ Batch ${batchNum}/${numBatches}: Got ${validQuestions.length}/${batchQuestionCount} questions`
              );
            }
          } catch (err) {
            console.error(
              `✗ Failed to generate ${subject} batch ${batchNum}:`,
              err
            );
            onProgress?.(
              `⚠️ ${subject} batch ${batchNum} failed. Continuing...`
            );
          }

          // Wait between batches if there are more batches for this subject
          if (batchNum < numBatches) {
            const waitTime = 90;
            console.log(`  Waiting ${waitTime}s before next batch...`);
            onProgress?.(`Waiting ${waitTime}s before next batch...`);
            await sleep(waitTime * 1000);
          }
        }

        // Add all questions generated for this subject
        allQuestions.push(...subjectQuestions);
        console.log(
          `✓ ${subject}: Generated ${subjectQuestions.length}/${subjectCount} questions (Total: ${allQuestions.length}/${totalTarget})`
        );

        // Wait between subjects to avoid rate limits (90 seconds - matches cooldown period)
        if (subjectIndex < subjects.length) {
          const waitTime = 90;
          console.log(`Waiting ${waitTime}s before next subject...`);
          onProgress?.(`Waiting ${waitTime}s before next subject...`);
          await sleep(waitTime * 1000);
        }
      }

      onProgress?.("Finalizing paper...");
      console.log(
        `Full paper generation complete: ${allQuestions.length}/${totalTarget} questions`
      );

      // Post-process
      return allQuestions.map((q, i) => ({
        ...q,
        id: `ai_full_${Date.now()}_${i}`,
        subject: q.subject as any,
      }));
    }

    return [];
  } catch (error) {
    console.error("AI Quiz Generation Error:", error);
    return [];
  }
};
