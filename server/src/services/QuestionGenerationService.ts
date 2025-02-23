import { openai, SYSTEM_MESSAGE, generateUserMessage, CACHE_DURATION_HOURS, isOpenAIConfigured } from '../config/openai';
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
    const { verticals, roles, topics, difficulty, count, useCache = true, useAI = true } = params;

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

    // Get sample questions for context
    const sampleQuestions = await this.getSampleQuestions(params);

    // Generate new questions using OpenAI
    const generatedQuestions = await this.callOpenAI({
      ...params,
      sampleQuestions
    });

    // Save to database and cache
    const savedQuestions = await this.saveQuestions(generatedQuestions, params);

    if (useCache) {
      await this.cacheQuestions(savedQuestions, params);
    }

    return savedQuestions;
  }

  private async getQuestionsFromDatabase(params: GenerationParams): Promise<IQuestion[]> {
    const { verticals, roles, topics, difficulty, count } = params;

    const questions = await Question.aggregate([
      {
        $match: {
          industryVerticals: { $in: verticals },
          roles: { $in: roles },
          topics: { $in: topics },
          difficulty: { $in: difficulty },
          'source.type': 'base'
        }
      },
      { $sample: { size: count } }
    ]);

    if (questions.length === 0) {
      throw new Error('No questions available for the selected criteria');
    }

    return questions;
  }

  private validateParams(params: GenerationParams): void {
    const { verticals, roles, topics, difficulty } = params;

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
  }

  private async findCachedQuestions(params: GenerationParams): Promise<IQuestion[]> {
    const { verticals, roles, topics, difficulty } = params;

    const cache = await QuestionCache.findOne({
      'metadata.verticals': { $all: verticals },
      'metadata.roles': { $all: roles },
      'metadata.topics': { $all: topics },
      'metadata.difficulty': { $all: difficulty },
      expiresAt: { $gt: new Date() }
    }).populate('questions');

    return cache ? (cache.questions as unknown as IQuestion[]) : [];
  }

  private async getSampleQuestions(params: GenerationParams): Promise<IQuestion[]> {
    const { verticals, roles, topics, difficulty } = params;

    return Question.find({
      industryVerticals: { $in: verticals },
      roles: { $in: roles },
      topics: { $in: topics },
      difficulty: { $in: difficulty },
      'source.type': 'base'
    }).limit(2);
  }

  private async callOpenAI(params: GenerationParams & { sampleQuestions: IQuestion[] }): Promise<GeneratedQuestion[]> {
    if (!openai || !isOpenAIConfigured()) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY environment variable.');
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
        model: 'gpt-4o'
      });

      if (!openai) {
        throw new Error('OpenAI client is not initialized');
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        n: 1
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
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
      throw new Error('Failed to generate questions');
    }
  }

  private parseOpenAIResponse(content: string): GeneratedQuestion[] {
    try {
      // The response might be wrapped in ```json ``` or just be plain JSON
      const jsonStr = content.replace(/```json\n|\```/g, '');
      const questions = JSON.parse(jsonStr);
      return Array.isArray(questions) ? questions : [questions];
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
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
        difficulty: params.difficulty
      }
    });

    await cache.save();
  }
}
