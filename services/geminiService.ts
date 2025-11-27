import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GradeLevel, Subject, QuizQuestion } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Generate a diagnostic quiz covering all provided topics
// Now generates 2 questions per topic with varying difficulty
export const generateDiagnosticQuiz = async (
  grade: GradeLevel,
  subject: Subject,
  topics: string[]
): Promise<QuizQuestion[]> => {
  const ai = getAiClient();
  
  const topicsStr = topics.join(", ");
  const prompt = `
    You are an expert junior high school teacher.
    Create a diagnostic test for a ${grade} student in ${subject}.
    
    For EACH of the following knowledge points: ${topicsStr}, you must generate exactly 2 questions:
    1. The first question should be of 'easy' or 'medium' difficulty (Basic concept check).
    2. The second question should be of 'medium' or 'hard' difficulty (Deep understanding check).
    
    Total questions: ${topics.length * 2}.
    
    The output must be in Chinese (Simplified).
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "An array of 4 possible answers"
        },
        correctIndex: { 
          type: Type.INTEGER,
          description: "The index (0-3) of the correct answer"
        },
        explanation: { 
          type: Type.STRING,
          description: "Explanation of the answer"
        },
        knowledgePoint: {
          type: Type.STRING,
          description: "Must be one of the requested knowledge points exactly."
        },
        difficulty: {
          type: Type.STRING,
          enum: ["easy", "medium", "hard"],
          description: "Difficulty level of the question"
        }
      },
      required: ["id", "question", "options", "correctIndex", "explanation", "knowledgePoint", "difficulty"],
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.6, 
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion[];
    }
    return [];
  } catch (error) {
    console.error("Error generating diagnostic quiz:", error);
    throw error;
  }
};

// Generate practice questions adapted to student performance
export const generateTrainingQuiz = async (
  grade: GradeLevel,
  subject: Subject,
  weakPoint: string,
  learningGoal?: string,
  currentScore?: number 
): Promise<QuizQuestion[]> => {
  const ai = getAiClient();
  
  const randomSeed = Math.floor(Math.random() * 10000);

  // Dynamic Difficulty Adjustment logic for 5 questions
  let difficultyInstruction = "Generate 1 'easy', 3 'medium', and 1 'hard' question to progressively test the student.";
  
  if (currentScore !== undefined) {
    if (currentScore < 60) {
      difficultyInstruction = `The student scored ${currentScore}/100 (Weak). Generate 2 'easy' questions and 3 'medium' questions. Focus on building confidence and basic concepts.`;
    } else if (currentScore >= 60 && currentScore < 85) {
      difficultyInstruction = `The student scored ${currentScore}/100 (Average). Generate 1 'easy', 2 'medium', and 2 'hard' questions to challenge them further.`;
    } else {
      difficultyInstruction = `The student scored ${currentScore}/100 (Strong). Generate 1 'medium' and 4 'hard' questions. Focus on advanced application and pitfalls.`;
    }
  }

  const prompt = `
    You are an expert junior high school tutor.
    Create a set of 5 multiple-choice practice questions (Single Choice) for a student in ${grade} studying ${subject}.
    
    Target Topic: "${weakPoint}".
    ${learningGoal ? `Target Learning Goal: "${learningGoal}".` : ''}
    
    ADAPTIVE DIFFICULTY STRATEGY:
    ${difficultyInstruction}
    
    Ensure these questions are varied and distinct.
    Random Seed: ${randomSeed}
    The output must be in Chinese (Simplified).
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "An array of 4 possible answers"
        },
        correctIndex: { 
          type: Type.INTEGER,
          description: "The index (0-3) of the correct answer in the options array"
        },
        explanation: { 
          type: Type.STRING,
          description: "A detailed explanation of why the answer is correct and why others are wrong."
        },
        difficulty: {
          type: Type.STRING,
          enum: ["easy", "medium", "hard"],
          description: "Difficulty level of the question"
        }
      },
      required: ["id", "question", "options", "correctIndex", "explanation", "difficulty"],
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion[];
    }
    return [];
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

// Generate a brief analysis comment based on scores
export const generateAnalysisComment = async (
  grade: GradeLevel,
  subject: Subject,
  points: {name: string, score: number}[]
): Promise<string> => {
  const ai = getAiClient();
  
  const weakPoints = points.filter(p => p.score < 70).map(p => p.name).join(", ");
  const strongPoints = points.filter(p => p.score >= 85).map(p => p.name).join(", ");

  const prompt = `
    As a teacher, provide a short, encouraging 2-sentence summary analysis for a ${grade} student in ${subject}.
    Their weak points are: ${weakPoints || "None"}.
    Their strong points are: ${strongPoints || "None"}.
    Write in Chinese. Be direct and helpful.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "加油！保持优势，攻克薄弱环节！";
  } catch (error) {
    console.error("Error generating comment:", error);
    return "系统暂时无法生成评语，请根据图表自行分析。";
  }
};