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
          // Pick 5 random questions for better style training
          const examples = allLocalQuestions
            .sort(() => 0.5 - Math.random())
            .slice(0, 5)
            .map(q => `Question: ${q.text}\nOptions:\nA. ${q.options[0]}\nB. ${q.options[1]}\nC. ${q.options[2]}\nD. ${q.options[3]}`);

          styleExamples = `
          STYLE REFERENCE - These are REAL KMU Prof exam questions. Match this EXACT style, difficulty, and format:
          
          ${examples.join('\n\n---\n\n')}
          
          KEY STYLE POINTS:
          - Match the clinical vignette style and length
          - Use similar medical terminology level
          - Match the difficulty (Prof exam level)
          `;
        }
      } catch (e) {
        console.warn('Failed to fetch local questions for style mimicry:', e);
      }

      onProgress?.('Generating custom quiz...');
      const questionCount = count || 10;
      const prompt = `
        Context: Medical Student Exam Preparation (MBBS) - KMU Prof Exam Style.
        Task: Generate a custom quiz for MBBS Block: ${block}. Focus specifically on the topic: "${topic}".
        Requirement: Generate EXACTLY ${questionCount} multiple choice questions.
        
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

      // Fetch style examples from KMU question bank for each subject
      onProgress?.('Loading KMU style examples...');
      const allLocalQuestions = await dbService.getAllQuestions();
      
      const allQuestions: Question[] = [];

      let totalGenerated = 0;
      const totalTarget = Object.values(distribution).reduce((a, b) => a + b, 0);

      for (const [subject, qCount] of Object.entries(distribution)) {
        console.log(`Generating ${qCount} questions for ${subject}...`);
        onProgress?.(`Generating ${subject} (${qCount} questions)... ${Math.round((totalGenerated / totalTarget) * 100)}%`);

        // Get subject-specific style examples from the KMU question bank
        let styleExamples = '';
        try {
          const subjectQuestions = allLocalQuestions.filter(q => 
            q.subject?.toLowerCase() === subject.toLowerCase() ||
            q.subject?.toLowerCase().includes(subject.toLowerCase()) ||
            subject.toLowerCase().includes(q.subject?.toLowerCase() || '')
          );
          
          if (subjectQuestions.length > 0) {
            // Pick 5 random questions from this subject for style training
            const examples = subjectQuestions
              .sort(() => 0.5 - Math.random())
              .slice(0, 5)
              .map(q => `Question: ${q.text}\nOptions:\nA. ${q.options[0]}\nB. ${q.options[1]}\nC. ${q.options[2]}\nD. ${q.options[3]}\nCorrect: ${String.fromCharCode(65 + q.correctIndex)}`);

            styleExamples = `
            STYLE REFERENCE - These are REAL KMU Prof exam questions. Match this EXACT style, difficulty, and clinical vignette format:
            
            ${examples.join('\n\n---\n\n')}
            
            KEY STYLE POINTS TO MATCH:
            - Use similar clinical scenario/vignette length
            - Match the medical terminology level
            - Use similar option formatting and length
            - Match the difficulty level (these are Prof exam level)
            `;
          } else {
            // Fallback to any subject questions if specific subject not found
            const examples = allLocalQuestions
              .sort(() => 0.5 - Math.random())
              .slice(0, 3)
              .map(q => `Question: ${q.text}\nOptions: ${q.options.join(' | ')}`);
            
            styleExamples = `
            Match this KMU Prof exam question style:
            ${examples.join('\n\n')}
            `;
          }
        } catch (e) {
          console.warn('Failed to fetch style examples:', e);
        }

        let subjectQuestions: Question[] = [];
        let remainingCount = qCount;
        let attempts = 0;
        const maxAttempts = 3;

        // Retry loop to ensure we get the exact number of questions
        while (remainingCount > 0 && attempts < maxAttempts) {
          attempts++;
          
          const prompt = `
            Context: Medical Student Exam Preparation (MBBS) - ${block} - KMU Prof Exam Style.
            
            ${styleExamples}
            
            Reference Syllabus:
            ${syllabusText.slice(0, 25000)}
            
            Task: Generate EXACTLY ${remainingCount} multiple choice questions for the subject: "${subject}".
            ${attempts > 1 ? `IMPORTANT: You previously generated fewer questions than requested. You MUST generate exactly ${remainingCount} questions this time.` : ''}
            Strictly follow the syllabus content for this subject.
            
            CRITICAL REQUIREMENTS:
            1. Generate EXACTLY ${remainingCount} questions - no more, no less.
            2. Each question MUST have an "explanation" field with a clear, educational explanation.
            3. All questions must be unique and not duplicates.
            4. MATCH THE KMU STYLE shown in the examples above - same difficulty, vignette style, and option formatting.
            
            Format: JSON Array of objects with the following structure:
            [
              {
                "id": "unique_id",
                "text": "Question text here (clinical vignette style matching KMU pattern)",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctIndex": 0,
                "subject": "${subject}", 
                "tags": ["${block}", "${subject}"],
                "difficulty": "Medium",
                "explanation": "Clear explanation of why the correct answer is right. Include the key concept, mechanism, or clinical pearl that makes this answer correct."
              }
            ]
            
            Ensure questions are high-quality, clinically relevant, and accurate.
            Do not include any markdown formatting.
          `;

          try {
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
            });

            const text = response.text;
            if (text) {
              const batch = JSON.parse(text) as Question[];
              
              // Ensure all questions have explanations
              const validBatch = batch.map(q => ({
                ...q,
                explanation: q.explanation || `The correct answer is ${q.options[q.correctIndex]}. This is a key concept in ${subject}.`
              }));
              
              subjectQuestions.push(...validBatch);
              remainingCount -= validBatch.length;
              console.log(`Got ${validBatch.length} questions for ${subject}, remaining: ${remainingCount}`);
            }
          } catch (err) {
            console.error(`Attempt ${attempts} failed for ${subject}:`, err);
          }

          // Small delay between attempts
          if (remainingCount > 0 && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // If we still don't have enough after max attempts, log a warning
        if (remainingCount > 0) {
          console.warn(`Could only generate ${subjectQuestions.length}/${qCount} questions for ${subject} after ${maxAttempts} attempts`);
        }

        allQuestions.push(...subjectQuestions);
        totalGenerated += subjectQuestions.length;

        // Add a small delay to avoid rate limits between subjects
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      onProgress?.('Finalizing paper...');
      
      console.log(`Full paper generation complete: ${allQuestions.length}/${totalTarget} questions`);

      // Post-process
      return allQuestions.map((q, i) => ({
        ...q,
        id: `ai_full_${Date.now()}_${i}`,
        subject: q.subject as any
      }));
    }

    return [];

  } catch (error) {
    console.error("Gemini Quiz Generation Error:", error);
    return [];
  }
};
