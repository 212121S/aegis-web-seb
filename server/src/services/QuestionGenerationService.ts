import { openai, SYSTEM_MESSAGE, generateUserMessage, CACHE_DURATION_HOURS, isOpenAIConfigured } from '../config/openai';
import type OpenAI from 'openai';
import { Question, IQuestion, QuestionConstants } from '../models/Question';
import { QuestionCache, IQuestionCache } from '../models/QuestionCache';
import type { PipelineStage } from 'mongoose';

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

  private async waitForConnection(maxWaitMs: number = 5000): Promise<void> {
    const startTime = Date.now();
    let connected = false;
    
    while (!connected && Date.now() - startTime < maxWaitMs) {
      try {
        await Question.findOne().select('_id').lean();
        connected = true;
        console.log('Database connection verified');
      } catch (error) {
        console.warn('Database connection not ready, retrying...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!connected) {
      throw new Error('Failed to establish database connection');
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelayMs: number = 2000
  ): Promise<T> {
    let lastError: Error = new Error('Operation failed');
    
    // First ensure we have a database connection
    await this.waitForConnection();
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        console.log(`Operation succeeded on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt < maxAttempts) {
          // Use exponential backoff with a minimum delay
          const delayMs = Math.max(
            initialDelayMs * Math.pow(2, attempt - 1),
            1000 // Ensure minimum 1 second delay between retries
          );
          console.log(`Retrying after ${delayMs}ms (Attempt ${attempt}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          // Verify connection before next attempt
          await this.waitForConnection(2000);
        }
      }
    }
    
    console.error('All retry attempts failed. Last error:', lastError);
    throw lastError;
  }

  private async getQuestionsFromDatabase(params: GenerationParams): Promise<IQuestion[]> {
    const { verticals, roles, topics, difficulty, count, type = 'multiple_choice' } = params;
    
    return this.retryOperation(async () => {
      let questions: IQuestion[] = [];
      console.log('Attempting to find questions with params:', {
        verticals,
        roles,
        topics,
        difficulty,
        type,
        count
      });

      // Try to find questions with relaxed matching criteria
      const baseQuery = { 'source.type': 'base', type };
      
      // First try exact matches with relaxed difficulty
      const difficultyRange = {
        $gte: Math.min(...difficulty),
        $lte: Math.max(...difficulty)
      };

      questions = await Question.find({
        ...baseQuery,
        industryVerticals: { $in: verticals },
        roles: { $in: roles },
        topics: { $in: topics },
        difficulty: difficultyRange
      }).limit(count);

      console.log(`Found ${questions.length} questions with exact match and difficulty range ${JSON.stringify(difficultyRange)}`);

      if (questions.length === 0) {
        // If no exact matches, use a more flexible approach
        // Define pipeline stages for flexible matching
        const pipeline: PipelineStage[] = [
          {
            $match: baseQuery
          },
          {
            $addFields: {
              matchScore: {
                $add: [
                  {
                    $multiply: [
                      { $size: { $setIntersection: ["$industryVerticals", verticals] } },
                      3
                    ]
                  },
                  {
                    $multiply: [
                      { $size: { $setIntersection: ["$roles", roles] } },
                      2
                    ]
                  },
                  {
                    $multiply: [
                      { $size: { $setIntersection: ["$topics", topics] } },
                      2
                    ]
                  },
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ["$difficulty", Math.min(...difficulty)] },
                          { $lte: ["$difficulty", Math.max(...difficulty)] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                ]
              }
            }
          },
          {
            $match: {
              matchScore: { $gt: 0 }
            }
          },
          {
            $sort: {
              matchScore: -1
            }
          } as PipelineStage.Sort,
          {
            $limit: count
          }
        ];

        const flexibleMatches = await Question.aggregate(pipeline);
        
        if (flexibleMatches.length > 0) {
          // Convert aggregation results back to Question documents
          questions = await Question.find({
            _id: { $in: flexibleMatches.map(q => q._id) }
          });
        }
      }

      if (questions.length === 0) {
        console.log('No questions found with any criteria');
        throw new Error('No questions available in the database. Please try different criteria or contact support.');
      }

      console.log(`Found ${questions.length} questions`);

      return questions;
    });
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

    const difficultyRange = {
      $gte: Math.min(...difficulty),
      $lte: Math.max(...difficulty)
    };

    const cache = await QuestionCache.findOne({
      'metadata.verticals': { $all: verticals },
      'metadata.roles': { $all: roles },
      'metadata.topics': { $all: topics },
      'metadata.type': type,
      expiresAt: { $gt: new Date() },
      'questions.difficulty': difficultyRange
    }).populate({
      path: 'questions',
      match: { difficulty: difficultyRange }
    });

    console.log(`Cache lookup with difficulty range ${JSON.stringify(difficultyRange)}`);

    return cache ? (cache.questions as unknown as IQuestion[]) : [];
  }

  private async getSampleQuestions(params: GenerationParams): Promise<IQuestion[]> {
    const { verticals, roles, topics, difficulty, type = 'multiple_choice' } = params;

    const difficultyRange = {
      $gte: Math.min(...difficulty),
      $lte: Math.max(...difficulty)
    };

    return Question.find({
      industryVerticals: { $in: verticals },
      roles: { $in: roles },
      topics: { $in: topics },
      difficulty: difficultyRange,
      'source.type': 'base',
      type
    }).limit(2);
  }

  private getDifficultySpecificSystemMessage(difficulty: number[]): string {
    // Get the highest difficulty level in the array
    const maxDifficulty = Math.max(...difficulty);
    
    // Return appropriate system message based on difficulty level
    switch(maxDifficulty) {
      case 1:
      case 2:
        return `For difficulty levels 1-2, create BASIC questions that:
1. Test fundamental knowledge and terminology
2. Focus on single concepts without requiring synthesis
3. Use straightforward scenarios with clear right/wrong answers
4. Require minimal analysis or calculation
5. Test recall of standard industry practices and definitions`;
        
      case 3:
      case 4:
        return `For difficulty levels 3-4, create INTERMEDIATE questions that:
1. Test application of concepts in straightforward scenarios
2. Require basic analysis of financial information
3. May involve simple calculations or methodologies
4. Test understanding of standard industry practices
5. Focus on well-established frameworks with minimal ambiguity`;
        
      case 5:
        return `For difficulty level 5, create CHALLENGING questions that:
1. Test application of concepts in moderately complex scenarios
2. Require multi-step analysis
3. Involve consideration of multiple factors
4. May have some contextual dependencies
5. Test ability to identify appropriate methodologies
6. Require understanding of industry-specific nuances`;
        
      case 6:
        return `For difficulty level 6, create ADVANCED questions that:
1. Test application of concepts in complex scenarios
2. Require sophisticated analysis with multiple variables
3. Involve interconnected factors and considerations
4. Test ability to evaluate tradeoffs between approaches
5. Require synthesis of multiple concepts
6. Include some market context dependencies
7. Test ability to identify and evaluate risks`;
        
      case 7:
        return `For difficulty level 7, create VERY ADVANCED questions that:
1. Test application of concepts in highly complex scenarios
2. Require integration of multiple domains (e.g., M&A, valuation, capital markets)
3. Involve significant market context dependencies
4. Test ability to evaluate multiple valid approaches
5. Require sophisticated risk-return analysis
6. Include practical implementation considerations
7. Test strategic thinking alongside technical knowledge
8. Require justification of chosen methodologies`;
        
      case 8:
        return `For difficulty level 8 questions, create EXTREMELY CHALLENGING scenarios that:

1. Integrate Multiple Domains:
- Combine knowledge across 3+ different areas (e.g., M&A, credit analysis, regulatory frameworks, ESG, geopolitics)
- Require synthesis of technical, strategic, and operational considerations

2. Include Market Context Dependencies:
- Make the correct approach dependent on complex, interconnected market conditions
- Require analysis of multiple conflicting market scenarios
- Test ability to identify which market factors are most critical

3. Demand Advanced Risk-Return Analysis:
- Test ability to identify and evaluate deeply interconnected risks
- Require assessment of third and fourth-order effects
- Include tail risk considerations and black swan scenarios

4. Present Complex Decision Trees:
- Include multiple valid approaches with different risk-reward profiles
- Require justification of chosen strategies under uncertainty
- Test ability to prioritize competing objectives

5. Address Implementation Challenges:
- Include practical constraints and real-world complications
- Test ability to adapt theoretical frameworks to practical situations
- Require consideration of stakeholder management

6. Asymmetric Information Scenarios:
- Create situations with incomplete information
- Test ability to identify what is unknown and how to mitigate information gaps
- Require decision-making under uncertainty with proper risk management

7. Regulatory Arbitrage Challenges:
- Present complex cross-border scenarios with conflicting regulatory frameworks
- Test understanding of global regulatory nuances and their strategic implications
- Require navigation of compliance requirements across multiple jurisdictions

8. Crisis Management Scenarios:
- Create high-pressure situations requiring rapid decision-making with limited information
- Test ability to prioritize actions and manage multiple stakeholders
- Require balancing short-term crisis response with long-term strategic implications

9. Ethical Dilemmas with Financial Implications:
- Present scenarios where optimal financial outcomes conflict with ethical considerations
- Test ability to navigate complex ethical terrain while maintaining fiduciary responsibility
- Require balancing shareholder value with broader stakeholder interests

10. Extreme Market Conditions:
- Create scenarios involving market dislocations, liquidity crises, or unprecedented events
- Test ability to adapt traditional frameworks to extreme conditions
- Require innovative approaches to valuation and risk management

Questions should be designed to truly differentiate the top 1% of candidates by testing both exceptional technical mastery and sophisticated strategic thinking. The ideal level 8 question should be answerable only by candidates with both deep expertise and the ability to synthesize complex, multi-faceted problems.`;
        
      default:
        return ''; // Default to empty string for no specific guidance
    }
  }

  private async callOpenAI(params: GenerationParams & { sampleQuestions: IQuestion[] }): Promise<GeneratedQuestion[]> {
    if (!openai || !isOpenAIConfigured()) {
      console.warn('OpenAI is not configured');
      return [];
    }

    // Get difficulty-specific system message
    const difficultySystemMessage = this.getDifficultySpecificSystemMessage(params.difficulty);
    const enhancedSystemMessage = `${SYSTEM_MESSAGE}\n\n${difficultySystemMessage}`;

    const messages = [
      { role: 'system' as const, content: enhancedSystemMessage },
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
        model: 'gpt-4o-mini',
        difficultyLevel: Math.max(...params.difficulty)
      });

      const completion = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages,
          temperature: 1.0,
          max_tokens: 2000,
          n: 1
        },
        { timeout: 120000 } // 2 minute timeout
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
