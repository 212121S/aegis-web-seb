import { openai, SYSTEM_MESSAGE, generateUserMessage, CACHE_DURATION_HOURS, isOpenAIConfigured } from '../config/openai';
import type OpenAI from 'openai';
import { Question, IQuestion, QuestionConstants } from '../models/Question';
import { QuestionCache, IQuestionCache } from '../models/QuestionCache';

interface GenerationParams {
  verticals: string[];
  roles: string[];
  topics: string[];
  difficulty: number[];
  count: number;
  useCache?: boolean;
  useAI?: boolean;
  type?: 'multiple_choice' | 'open_ended';
}

interface GeneratedQuestion {
  text: string;
  answer: string;
  explanation: string;
  type: 'multiple_choice' | 'open_ended';
  options?: string[];
  correctOption?: string;
}

export class QuestionGenerationService {
  private static instance: QuestionGenerationService;

  private constructor() {}

  public static getInstance(): QuestionGenerationService {
    if (!QuestionGenerationService.instance) {
      QuestionGenerationService.instance = new QuestionGenerationService();
    }
    return QuestionGenerationService.instance;
  }

  public async generateQuestions(params: GenerationParams): Promise<IQuestion[]> {
    const { verticals, roles, topics, difficulty, count, useCache = true, useAI = true, type = 'multiple_choice' } = params;

    // Validate parameters
    this.validateParams(params);

    // Check if AI generation is requested but not available
    if (useAI && !isOpenAIConfigured()) {
      console.warn('AI generation requested but OpenAI is not configured. Falling back to database questions.');
      return this.getQuestionsFromDatabase(params);
    }

    // Check cache if enabled
    if (useCache && useAI) {
      const cachedQuestions = await this.findCachedQuestions(params);
      if (cachedQuestions.length >= count) {
        return cachedQuestions.slice(0, count);
      }
    }

    // If AI is not requested or not available, get questions from database
    if (!useAI) {
      return this.getQuestionsFromDatabase(params);
    }

    try {
      // Get sample questions for context
      const sampleQuestions = await this.getSampleQuestions(params);

      // Generate new questions using OpenAI
      const generatedQuestions = await this.callOpenAI({
        ...params,
        sampleQuestions
      });

      // If no valid questions were generated, fall back to database
      if (!generatedQuestions.length) {
        console.warn('No valid AI-generated questions. Falling back to database questions.');
        return this.getQuestionsFromDatabase(params);
      }

      // Save to database and cache
      const savedQuestions = await this.saveQuestions(generatedQuestions, params);

      if (useCache) {
        await this.cacheQuestions(savedQuestions, params);
      }

      return savedQuestions;
    } catch (error) {
      console.error('Failed to generate AI questions:', error);
      try {
        return await this.getQuestionsFromDatabase(params);
      } catch (dbError) {
        console.error('Failed to get database questions:', dbError);
        throw new Error('Failed to generate questions from both AI and database');
      }
    }
  }

  private async getQuestionsFromDatabase(params: GenerationParams): Promise<IQuestion[]> {
    const { verticals, roles, topics, difficulty, count, type = 'multiple_choice' } = params;
    let questions: IQuestion[] = [];

    try {
      console.log('Attempting to find questions with params:', {
        verticals,
        roles,
        topics,
        difficulty,
        type,
        count
      });

      // Try to find questions with exact match first
      questions = await Question.find({
        industryVerticals: { $in: verticals },
        roles: { $in: roles },
        topics: { $in: topics },
        difficulty: { $in: difficulty },
        'source.type': 'base',
        type
      }).limit(count);

      console.log('Exact match query result count:', questions.length);

      // If no questions found, try with more relaxed criteria
      if (questions.length === 0) {
        console.log('No exact matches, trying relaxed criteria...');
        questions = await Question.find({
          $or: [
            { industryVerticals: { $in: verticals } },
            { roles: { $in: roles } },
            { topics: { $in: topics } }
          ],
          difficulty: { $in: difficulty },
          'source.type': 'base',
          type
        }).limit(count);

        console.log('Relaxed criteria query result count:', questions.length);
      }

      // If still no questions, try without difficulty constraint
      if (questions.length === 0) {
        console.log('No matches with relaxed criteria, trying without difficulty constraint...');
        questions = await Question.find({
          $or: [
            { industryVerticals: { $in: verticals } },
            { roles: { $in: roles } },
            { topics: { $in: topics } }
          ],
          'source.type': 'base',
          type
        }).limit(count);

        console.log('Query without difficulty constraint result count:', questions.length);
      }

      // If still no questions, try with just the type
      if (questions.length === 0) {
        console.log('No matches found, trying with just type constraint...');
        questions = await Question.find({
          'source.type': 'base',
          type
        }).limit(count);

        console.log('Basic type-only query result count:', questions.length);
      }

      if (questions.length === 0) {
        console.log('No questions found with any criteria');
        throw new Error('No questions available in the database. Please try different criteria or contact support.');
      }

      return questions;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to retrieve questions from database. Please try again later.');
    }
  }

  private validateParams(params: GenerationParams): void {
    const { verticals, roles, topics, difficulty, type = 'multiple_choice' } = params;

    // Validate verticals
    if (!verticals.every(v => QuestionConstants.VALID_VERTICALS.includes(v))) {
      throw new Error('Invalid industry vertical(s)');
    }

    // Validate roles
    if (!roles.every(r => QuestionConstants.VALID_ROLES.includes(r))) {
      throw new Error('Invalid role(s)');
    }

    // Validate topics
    if (!topics.every(t => QuestionConstants.VALID_TOPICS.includes(t))) {
      throw new Error('Invalid topic(s)');
    }

    // Validate difficulty
    if (!difficulty.every(d => Number.isInteger(d) && d >= 1 && d <= 8)) {
      throw new Error('Difficulty must be integers between 1 and 8');
    }

    // Validate question type
    if (type !== 'multiple_choice' && type !== 'open_ended') {
      throw new Error('Invalid question type');
    }
  }

  private async findCachedQuestions(params: GenerationParams): Promise<IQuestion[]> {
    const { verticals, roles, topics, difficulty, type = 'multiple_choice' } = params;

    const cache = await QuestionCache.findOne({
      'metadata.verticals': { $all: verticals },
      'metadata.roles': { $all: roles },
      'metadata.topics': { $all: topics },
      'metadata.difficulty': { $all: difficulty },
      'metadata.type': type,
      expiresAt: { $gt: new Date() }
    }).populate('questions');

    return cache ? (cache.questions as unknown as IQuestion[]) : [];
  }

  private async getSampleQuestions(params: GenerationParams): Promise<IQuestion[]> {
    const { verticals, roles, topics, difficulty, type = 'multiple_choice' } = params;

    return Question.find({
      industryVerticals: { $in: verticals },
      roles: { $in: roles },
      topics: { $in: topics },
      difficulty: { $in: difficulty },
      'source.type': 'base',
      type
    }).limit(2);
  }

  private async callOpenAI(params: GenerationParams & { sampleQuestions: IQuestion[] }): Promise<GeneratedQuestion[]> {
    if (!openai || !isOpenAIConfigured()) {
      console.warn('OpenAI is not configured');
      return [];
    }

    const messages = [
      { role: 'system' as const, content: SYSTEM_MESSAGE },
      { 
        role: 'user' as const, 
        content: generateUserMessage({
          ...params,
          sampleQuestions: params.sampleQuestions
        })
      }
    ];

    try {
      console.log('OpenAI Configuration:', {
        isConfigured: isOpenAIConfigured(),
        apiKeyLength: process.env.OPENAI_API_KEY?.length,
        model: 'chatgpt-4o-latest'
      });

      const completion = await openai.chat.completions.create(
        {
        model: 'chatgpt-4o-latest',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        n: 1
        },
        { timeout: 15000 } // 15 second timeout
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        console.warn('No content in OpenAI response');
        return [];
      }

      return this.parseOpenAIResponse(content);
    } catch (error: any) {
      console.error('OpenAI API error:', {
        name: error.name,
        message: error.message,
        status: error.status,
        response: error.response?.data,
        stack: error.stack
      });

      // If it's a timeout or any other error, quickly fall back to database
      console.warn('Falling back to database questions due to OpenAI error');
      return [];
    }
  }

  private parseOpenAIResponse(content: string): GeneratedQuestion[] {
    try {
      // The response might be wrapped in ```json ``` or just be plain JSON
      const jsonStr = content.replace(/```json\n|\```/g, '');
      const questions = JSON.parse(jsonStr);
      const parsedQuestions = Array.isArray(questions) ? questions : [questions];

      // Validate and filter questions
      return parsedQuestions.filter(q => {
        try {
          // Check required fields
          if (!q.text || typeof q.text !== 'string') return false;
          if (!q.answer || typeof q.answer !== 'string') return false;
          if (!q.explanation || typeof q.explanation !== 'string') return false;
          if (!q.type || !['multiple_choice', 'open_ended'].includes(q.type)) return false;

          // Check multiple choice specific fields
          if (q.type === 'multiple_choice') {
            if (!Array.isArray(q.options) || q.options.length < 2) return false;
            if (!q.correctOption || !q.options.includes(q.correctOption)) return false;
          }

          return true;
        } catch (error) {
          console.error('Question validation error:', error);
          return false;
        }
      });
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      return [];
    }
  }

  private async saveQuestions(
    questions: GeneratedQuestion[],
    params: GenerationParams
  ): Promise<IQuestion[]> {
    const savedQuestions = await Promise.all(
      questions.map(q => {
        const questionDoc = new Question({
          ...q,
          industryVerticals: params.verticals,
          roles: params.roles,
          topics: params.topics,
          difficulty: params.difficulty[0], // Use first difficulty level
          type: params.type || 'multiple_choice',
          source: {
            type: 'ai',
            timestamp: new Date(),
            cached: false
          }
        });
        return questionDoc.save();
      })
    );

    return savedQuestions;
  }

  private async cacheQuestions(
    questions: IQuestion[],
    params: GenerationParams
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);

    const cache = new QuestionCache({
      prompt: generateUserMessage({
        ...params,
        count: questions.length
      }),
      questions: questions.map(q => q._id),
      expiresAt,
      metadata: {
        verticals: params.verticals,
        roles: params.roles,
        topics: params.topics,
        difficulty: params.difficulty,
        type: params.type || 'multiple_choice'
      }
    });

    await cache.save();
  }
}
