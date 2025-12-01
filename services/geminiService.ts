import { GoogleGenAI } from "@google/genai";
import { Question } from '../types';
import { getApiKey } from './apiKeyService';
import { dbService } from './databaseService';

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

export const generateStudyNotes = async (
  questions: Question[],
  mode: 'concise' | 'detailed' = 'concise',
  customTitle?: string
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI Configuration missing.";

  try {
    // Limit context to avoid token limits (e.g., first 50 questions)
    const contextQuestions = questions.slice(0, 50).map(q =>
      `- Topic: ${q.tags.join(', ')}\n  Question: ${q.text}\n  Correct Answer: ${q.options[q.correctIndex]}`
    ).join('\n');

    let taskDescription = '';
    if (mode === 'concise') {
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate notes.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate notes due to an error.";
  }
};


const BLOCK_DISTRIBUTIONS: Record<string, Record<string, number>> = {
  'Block J': {
    'Pharmacology': 20,
    'Pathology': 22,
    'Forensic Medicine': 18,
    'Community Medicine': 27,
    'PRIME': 2,
    'Medicine': 11,
    'Psychiatry': 9
  },
  'Block K': {
    'Pathology': 41,
    'Community Medicine': 18,
    'Pharmacology': 16,
    'Forensic Medicine': 16,
    'Surgery': 12,
    'Medicine': 11
  },
  'Block L': {
    'Gynecology': 40,
    'Pathology': 23,
    'Community Medicine': 17,
    'Medicine': 10,
    'Pharmacology': 9,
    'Surgery': 9,
    'Forensic Medicine': 7
  },
  'Block M1': {
    'ENT': 90
  },
  'Block M2': {
    'Ophthalmology': 90 // Mapped 'Eye' to 'Ophthalmology' for consistency with Subject enum
  }
};

const BLOCK_SYLLABUS_FILES: Record<string, string> = {
  'Block J': 'Block_J_syllabus.txt',
  'Block K': 'Block_K_syllabus.txt',
  'Block L': 'Block_L_syllabus.txt',
  'Block M1': 'Block_M1_syllabus.txt',
  'Block M2': 'Block_M2_syllabus.txt'
};

export const generateQuiz = async (
  block: string,
  type: 'full' | 'custom',
  topic?: string,
  count?: number,
  onProgress?: (message: string) => void
): Promise<Question[]> => {
  const ai = getAIClient();

  if (!ai) {
    console.error("AI Configuration missing.");
    throw new Error("API_KEY_MISSING");
  }

  try {
    // 1. Handle Custom Quiz (Simple Path)
    if (type === 'custom') {
      onProgress?.('Fetching style examples...');

      // Fetch random questions from DB for style mimicry
      let styleExamples = '';
      try {
        const allLocalQuestions = await dbService.getAllQuestions();
        if (allLocalQuestions.length > 0) {
          // Pick 3 random questions
          const examples = allLocalQuestions
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(q => `- Question: ${q.text}\n  Options: ${q.options.join(', ')}`);

          styleExamples = `
          Here are examples of the style, difficulty, and formatting of questions I want you to mimic:
          ${examples.join('\n\n')}
          
          Please ensure the new questions match this clinical vignette style and difficulty level.
          `;
        }
      } catch (e) {
        console.warn('Failed to fetch local questions for style mimicry:', e);
      }

      onProgress?.('Generating custom quiz...');
      const questionCount = count || 10;
      const prompt = `
        Context: Medical Student Exam Preparation (MBBS).
        Task: Generate a custom quiz for MBBS Block: ${block}. Focus specifically on the topic: "${topic}".
        Requirement: Generate ${questionCount} multiple choice questions.
        
        ${styleExamples}

        Format: JSON Array of objects with the following structure:
        [
          {
            "id": "unique_id",
            "text": "Question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0, // 0-3
            "subject": "${block}", 
            "tags": ["${topic || block}"],
            "difficulty": "Medium",
            "explanation": "Brief explanation of why the correct answer is right and others are wrong."
          }
        ]
        Ensure questions are high-quality, clinically relevant, and accurate.
        Do not include any markdown formatting (like \`\`\`json), just the raw JSON array.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text;
      if (!text) return [];
      const questions = JSON.parse(text) as Question[];
      return questions.map((q, i) => ({ ...q, id: `ai_${Date.now()}_${i}`, subject: block as any }));
    }

    // 2. Handle Full Paper (Complex Path)
    if (type === 'full') {
      console.log(`Starting Full Paper Generation for ${block}...`);
      onProgress?.('Loading syllabus...');

      const syllabusFile = BLOCK_SYLLABUS_FILES[block];
      const distribution = BLOCK_DISTRIBUTIONS[block];

      if (!syllabusFile || !distribution) {
        console.error(`Configuration missing for ${block}`);
        return [];
      }

      // Fetch Syllabus
      let syllabusText = '';
      try {
        const response = await fetch(`/assets/${syllabusFile}`);
        if (response.ok) {
          syllabusText = await response.text();
          console.log('Syllabus loaded, length:', syllabusText.length);
        } else {
          console.warn('Failed to load syllabus file');
        }
      } catch (e) {
        console.error('Error loading syllabus:', e);
      }

      const allQuestions: Question[] = [];

      let totalGenerated = 0;
      const totalTarget = Object.values(distribution).reduce((a, b) => a + b, 0);

      for (const [subject, qCount] of Object.entries(distribution)) {
        console.log(`Generating ${qCount} questions for ${subject}...`);
        onProgress?.(`Generating ${subject} (${qCount} questions)... ${Math.round((totalGenerated / totalTarget) * 100)}%`);

        // Extract relevant syllabus part (naive approach: pass whole syllabus or rely on AI to pick)
        // Passing 40KB syllabus in every prompt might be okay for Gemini 1.5 Flash (1M context), 
        // but let's be efficient. We'll pass the whole thing as "Reference Material".

        const prompt = `
          Context: Medical Student Exam Preparation (MBBS) - ${block}.
          Reference Syllabus:
          ${syllabusText.slice(0, 30000)} ... (truncated if too long)
          
          Task: Generate ${qCount} multiple choice questions for the subject: "${subject}".
          Strictly follow the syllabus content for this subject.
          
          Format: JSON Array of objects with the following structure:
          [
            {
              "id": "unique_id",
              "text": "Question text here",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctIndex": 0, // 0-3
              "subject": "${subject}", 
              "tags": ["${block}", "${subject}"],
              "difficulty": "Medium"
            }
          ]
          
          Ensure questions are high-quality, clinically relevant, and accurate.
          Do not include any markdown formatting.
        `;

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Using 2.5-flash as requested for consistency and advanced features
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });

          const text = response.text;
          if (text) {
            const batch = JSON.parse(text) as Question[];
            allQuestions.push(...batch);
            totalGenerated += batch.length;
          }
        } catch (err) {
          console.error(`Failed to generate for ${subject}:`, err);
          // Continue to next subject even if one fails
        }

        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      onProgress?.('Finalizing paper...');

      // Post-process
      return allQuestions.map((q, i) => ({
        ...q,
        id: `ai_full_${Date.now()}_${i}`,
        subject: q.subject as any // Keep the specific subject (e.g. Pharmacology)
      }));
    }

    return [];

  } catch (error) {
    console.error("Gemini Quiz Generation Error:", error);
    return [];
  }
};
