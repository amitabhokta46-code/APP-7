
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, AIChatMessage, MockTest, GovExamType, GovQuestion, GovMockInstance } from "../types";

export const generateGovMCQs = async (exam: GovExamType, subject: string, topic: string, count: number, language: 'EN' | 'HI'): Promise<GovQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const examLogic = {
    'UPSC': 'Conceptual, elimination-based, deep analytical thinking, statement-heavy. Use complex distractors.',
    'SSC': 'Speed and accuracy focused, factual, direct, some calculation-heavy questions.',
    'Banking': 'Logical reasoning, complex calculation, data interpretation heavy, time-pressured.',
    'Defence': 'Standard difficulty, factual and conceptual mix, focus on fundamentals.',
    'Railways': 'Factual, simple to moderate difficulty, standard syllabus.',
    'Insurance': 'Standard banking pattern with insurance specific terminology where applicable.',
    'State PSC': 'Standard factual and analytical mix, localized context where possible.'
  };

  const languagePrompt = language === 'HI' ? "Output all text (questions, options, explanations) in HINDI." : "Output all text in ENGLISH.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert examiner for ${exam} in India. 
      Generate exactly ${count} MCQs for the subject "${subject}" and topic "${topic}".
      ${languagePrompt}
      Difficulty Distribution: Balanced (30% Easy, 40% Medium, 30% Hard).
      Exam Behavior Policy: ${examLogic[exam] || 'Standard Indian Government Exam pattern.'}
      
      Format Requirements:
      - 4 unique options.
      - 1 correct index (0-3).
      - Strategic Explanation: Explain the 'Key Concept' and 'Why other options are wrong'.
      - Categorize each: Difficulty (Easy/Medium/Hard) and Type (Factual/Conceptual/Analytical/Numerical/Assertion-Reason).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  type: { type: Type.STRING },
                  topic: { type: Type.STRING }
                },
                required: ["text", "options", "correctIndex", "explanation", "difficulty", "type", "topic"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"questions": []}');
    return (parsed.questions || []).map((q: any) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (error) {
    console.error("MCQ Gen Error:", error);
    return [];
  }
};

export const analyzeGovPerformance = async (mock: GovMockInstance) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const summary = {
    exam: mock.exam,
    subject: mock.subject,
    score: mock.score,
    total: mock.totalMarks,
    accuracy: (mock.userAnswers.filter((a, i) => a === mock.questions[i].correctIndex).length / mock.questions.length * 100).toFixed(1)
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this ${mock.exam} test performance: ${JSON.stringify(summary)}. 
      Provide a 3-sentence high-impact strategic feedback to improve rank.`,
      config: { systemInstruction: "Be an encouraging but strict IAS/SSC coach." }
    });
    return response.text || "Keep practicing consistent revision.";
  } catch (e) {
    return "Analysis engine busy. Review your mistakes manually.";
  }
};

export const getAIInsights = async (state: AppState) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const studyMins = state.studySessions.reduce((acc, s) => acc + s.duration, 0);
  const avgSleep = state.sleepSessions.length > 0 
    ? state.sleepSessions.reduce((acc, s) => acc + s.duration, 0) / state.sleepSessions.length 
    : 8;
    
  const weakTopics = Object.entries(state.syllabus).flatMap(([sub, nodes]) => 
    nodes.filter(n => n.confidence < 3).map(n => `${sub}: ${n.name}`)
  ).slice(0, 5);

  const nearestExam = [...state.exams].sort((a, b) => a.date - b.date)[0];
  const examContext = nearestExam ? `Targeting ${nearestExam.name} on ${new Date(nearestExam.date).toLocaleDateString()}.` : "No specific exam date set.";

  const summary = {
    studyHours: (studyMins / 60).toFixed(1),
    avgSleep: avgSleep.toFixed(1),
    weakTopicsCount: weakTopics.length,
    weakTopicsList: weakTopics,
    recentMockAccuracy: state.mockTests.length > 0 ? (state.mockTests[0].correct / (state.mockTests[0].attempted || 1) * 100).toFixed(0) : "N/A",
    examContext
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `You are an elite productivity coach for competitive exam aspirants. Analyze this student performance context: ${JSON.stringify(summary)}. 
      Provide 4 highly specific, scientific, and actionable study tips. Avoid generic advice.
      Focus on memory retention (active recall), recovery (sleep), and exam-specific urgency.`,
      config: {
        systemInstruction: "You are a helpful study assistant.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 4 actionable study suggestions."
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return parsed.suggestions || [];
  } catch (error) {
    console.error("AI Insights Error:", error);
    return ["Focus on active recall.", "Ensure consistent sleep.", "Prioritize weak areas.", "Maintain high urgency."];
  }
};

export const getNeuralAssistantChat = async (message: string, history: AIChatMessage[], state: AppState) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = {
    userName: state.profile.name,
    subjects: state.subjects.map(s => s.name),
    disciplineStreak: state.disciplineStreak,
    recentMockScore: state.mockTests[0]?.scoreObtained || "None",
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        { role: 'user', parts: [{ text: `CONTEXT: User Profile: ${JSON.stringify(context)}. App History: ${JSON.stringify(history.slice(-5))}. QUEST: ${message}` }] }
      ],
      config: {
        systemInstruction: "You are 'Neural Assistant', the OS intelligence for ExamOS. Be concise, scientific, and highly supportive. Use Markdown for formatting. Help with study schedules, concept explanations, and motivation."
      }
    });
    return response.text || "Neural core offline. Please retry.";
  } catch (e) {
    console.error("Chat Error:", e);
    return "Error connecting to Neural Net.";
  }
};

export const synthesizeMaterial = async (name: string, notes: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize this study material titled '${name}'. Notes: ${notes}. Provide a 'Five-Line Mastery' summary and 3 critical exam-oriented questions.`,
      config: { systemInstruction: "Output concise, bulleted markdown synthesis." }
    });
    return response.text || "Synthesis failed.";
  } catch (e) { 
    console.error("Synthesis Error:", e);
    return "Synthesis unavailable."; 
  }
};

export const analyzeMockMistakes = async (test: MockTest) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these mock test errors: ${JSON.stringify(test.mistakes)}. Score: ${test.scoreObtained}/${test.totalMarks}. Errors categories: ${JSON.stringify(test.errorCategories)}.`,
      config: { systemInstruction: "Provide a 3-step action plan to eliminate these error patterns. Be highly specific." }
    });
    return response.text || "Analysis complete.";
  } catch (e) { 
    console.error("Analysis Error:", e);
    return "Analysis failed."; 
  }
};
