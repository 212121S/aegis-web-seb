import OpenAI from 'openai';

// Log OpenAI configuration details
const apiKey = process.env.OPENAI_API_KEY;
console.log('OpenAI Configuration Details:', {
  apiKeyExists: !!apiKey,
  apiKeyLength: apiKey?.length,
  apiKeyPrefix: apiKey?.substring(0, 7),
  envVars: Object.keys(process.env).filter(key => key.includes('OPENAI'))
});

export const openai = apiKey 
  ? new OpenAI({ 
      apiKey,
      organization: process.env.OPENAI_ORG_ID // optional
    })
  : null;

// Helper to check if OpenAI is configured
export const isOpenAIConfigured = () => {
  const configured = !!openai;
  console.log('OpenAI Client Status:', {
    configured,
    clientExists: !!openai,
    hasApiKey: !!apiKey
  });
  return configured;
};

console.log(apiKey 
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
  type?: 'multiple_choice' | 'open_ended';
  sampleQuestions?: any[];
}) => {
  const {
    verticals,
    roles,
    topics,
    difficulty,
    count,
    type = 'multiple_choice',
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
4. Generate only ${type === 'multiple_choice' ? 'multiple choice' : 'written answer'} questions
5. Format each question as a JSON object following the specified structure`;

  if (sampleQuestions?.length) {
    message += `\n\nReference these sample questions for style and difficulty calibration:
${JSON.stringify(sampleQuestions, null, 2)}`;
  }

  return message;
};
