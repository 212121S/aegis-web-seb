import { Configuration, OpenAIApi } from 'openai';

const configuration = process.env.OPENAI_API_KEY 
  ? new Configuration({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const openai = configuration ? new OpenAIApi(configuration) : null;

// Helper to check if OpenAI is configured
export const isOpenAIConfigured = () => !!configuration;

console.log(process.env.OPENAI_API_KEY 
  ? '✓ OpenAI API configured'
  : '⚠️  OpenAI API key not configured - AI question generation will be disabled');

// Cache duration in hours
export const CACHE_DURATION_HOURS = 24;

// System message template for question generation
export const SYSTEM_MESSAGE = `You are an expert investment banking technical interviewer. Your role is to generate high-quality technical questions for investment banking interviews based on the provided parameters. Each question should be challenging but fair, testing both theoretical understanding and practical application.

Follow these guidelines:
1. Questions should be clear and unambiguous
2. Include a detailed answer that demonstrates deep understanding
3. Provide an explanation that helps candidates learn from the question
4. Match the difficulty level requested (1-8 scale)
5. Ensure questions are relevant to the specified industry verticals, roles, and topics
6. Include practical, real-world scenarios when appropriate

Format each question as a JSON object with the following structure:
{
  "text": "The question text",
  "answer": "The complete answer",
  "explanation": "Detailed explanation of the concepts and solution approach",
  "type": "multiple_choice" or "open_ended",
  "options": ["Option A", "Option B", "Option C", "Option D"] (for multiple_choice only),
  "correctOption": "The correct option" (for multiple_choice only)
}`;

// Helper function to generate the user message for the API
export const generateUserMessage = (params: {
  verticals: string[];
  roles: string[];
  topics: string[];
  difficulty: number[];
  count: number;
  sampleQuestions?: any[];
}) => {
  const {
    verticals,
    roles,
    topics,
    difficulty,
    count,
    sampleQuestions
  } = params;

  let message = `Generate ${count} unique technical interview questions with the following parameters:

Industry Verticals: ${verticals.join(', ')}
Roles: ${roles.join(', ')}
Topics: ${topics.join(', ')}
Difficulty Level(s): ${difficulty.join(', ')} (on a scale of 1-8)

Requirements:
1. Questions should be specifically tailored to the intersection of the given verticals, roles, and topics
2. Maintain the specified difficulty level(s)
3. Include a mix of theoretical and practical questions
4. Format each question as a JSON object following the specified structure`;

  if (sampleQuestions?.length) {
    message += `\n\nReference these sample questions for style and difficulty calibration:
${JSON.stringify(sampleQuestions, null, 2)}`;
  }

  return message;
};
