import { Request, Response } from 'express';
import { QuestionGenerationService } from '../services/QuestionGenerationService';
import { GradingService, ConceptFeedback } from '../services/GradingService';
import { Question, QuestionConstants, IQuestion } from '../models/Question';
import { User } from '../models/User';
import { Types } from 'mongoose';

interface QuestionResult {
  questionId: string;
  questionText: string;
  correct: boolean;
  score: number;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  conceptsFeedback?: ConceptFeedback[];
  holisticFeedback?: {
    score: number;
    feedback: string;
  };
}

interface UserDocument {
  _id: Types.ObjectId;
  subscription: {
    active: boolean;
  };
}

export const getTestConfiguration = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Return all valid configuration options
    res.json({
      verticals: QuestionConstants.VALID_VERTICALS,
      roles: QuestionConstants.VALID_ROLES,
      topics: QuestionConstants.VALID_TOPICS,
      difficultyRange: { min: 1, max: 8 }
    });
  } catch (error) {
    console.error('Get test configuration error:', error);
    res.status(500).json({ error: 'Failed to get test configuration' });
  }
};

export const generatePracticeTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const {
      verticals,
      roles,
      topics,
      difficulty,
      count,
      useAI = true,
      questionType = 'multiple-choice'
    } = req.body;

    // Validate request parameters
    if (!verticals?.length || !roles?.length || !topics?.length) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    if (!difficulty?.length || !difficulty.every(d => d >= 1 && d <= 8)) {
      res.status(400).json({ error: 'Invalid difficulty range' });
      return;
    }

    if (!count || count < 1 || count > 20) {
      res.status(400).json({ error: 'Invalid question count (1-20)' });
      return;
    }

    // Generate questions based on questionType
    const questionService = QuestionGenerationService.getInstance();
    let questions: IQuestion[] = [];

    if (questionType === 'all') {
      // Calculate counts for each type
      const mcqCount = Math.ceil(count / 2);
      const writtenCount = count - mcqCount;

      // Generate multiple choice questions
      const mcqQuestions = await questionService.generateQuestions({
        verticals,
        roles,
        topics,
        difficulty,
        count: mcqCount,
        useAI,
        type: 'multiple_choice'
      });

      // Generate written answer questions
      const writtenQuestions = await questionService.generateQuestions({
        verticals,
        roles,
        topics,
        difficulty,
        count: writtenCount,
        useAI,
        type: 'open_ended'
      });

      // Combine and shuffle questions
      questions = [...mcqQuestions, ...writtenQuestions]
        .sort(() => Math.random() - 0.5); // Randomize question order
    } else {
      // Generate questions of a single type
      const type = questionType === 'multiple-choice' ? 'multiple_choice' : 'open_ended';
      questions = await questionService.generateQuestions({
        verticals,
        roles,
        topics,
        difficulty,
        count,
        useAI,
        type
      });
    }

    // Create a test session
    const testSession = {
      questions: questions.map(q => ({
        questionId: q._id,
        text: q.text,
        type: q.type,
        options: q.options,
        difficulty: q.difficulty,
        topics: q.topics,
        industryVerticals: q.industryVerticals,
        roles: q.roles
      })),
      config: {
        verticals,
        roles,
        topics,
        difficulty,
        useAI
      }
    };

    res.json(testSession);
  } catch (error) {
    console.error('Generate practice test error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate practice test' 
    });
  }
};

export const submitPracticeTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { answers } = req.body as { 
      answers: Array<{ 
        questionId: string; 
        answer: string;
      }> 
    };

    if (!Array.isArray(answers)) {
      res.status(400).json({ error: 'Invalid answers format' });
      return;
    }

    // Get questions with correct answers
    const questionIds = answers.map(a => new Types.ObjectId(a.questionId));
    const questions = await Question.find({ _id: { $in: questionIds } });

    try {
      // Initialize results object
      const results = {
        overall: { correct: 0, total: answers.length, percentage: 0 },
        byTopic: {} as Record<string, { correct: number; total: number; percentage: number }>,
        byVertical: {} as Record<string, { correct: number; total: number; percentage: number }>,
        byRole: {} as Record<string, { correct: number; total: number; percentage: number }>,
        questions: new Array<QuestionResult>()
      };

      // Process each answer
      for (const answer of answers) {
        const question = questions.find(q => q._id.toString() === answer.questionId);
        if (!question) continue;

        let score = 0;
        let conceptsFeedback: ConceptFeedback[] = [];
        
        let holisticFeedback;
        
        if (question.type === 'multiple_choice') {
          score = answer.answer === question.correctOption ? 100 : 0;
        } else {
          try {
            const gradingService = GradingService.getInstance();
            const gradingResult = await gradingService.gradeWrittenAnswer(answer.answer, question);
            score = gradingResult.score;
            conceptsFeedback = gradingResult.conceptsFeedback;
            holisticFeedback = gradingResult.holisticFeedback;
          } catch (error) {
            console.error('Error grading written answer:', error);
            score = 0; // Default to 0 if grading fails
          }
        }

        results.overall.correct += score / 100;

        // Add to question results
        results.questions.push({
          questionId: question._id.toString(),
          questionText: question.text,
          correct: score === 100,
          score: score,
          userAnswer: answer.answer,
          correctAnswer: question.type === 'multiple_choice' ? question.correctOption! : question.answer,
          explanation: question.explanation,
          conceptsFeedback: question.type === 'open_ended' ? conceptsFeedback : undefined,
          holisticFeedback: holisticFeedback
        });

        // Update topic scores
        question.topics.forEach(topic => {
          if (!results.byTopic[topic]) {
            results.byTopic[topic] = { correct: 0, total: 0, percentage: 0 };
          }
          results.byTopic[topic].total++;
          results.byTopic[topic].correct += score / 100;
        });

        // Update vertical scores
        question.industryVerticals.forEach(vertical => {
          if (!results.byVertical[vertical]) {
            results.byVertical[vertical] = { correct: 0, total: 0, percentage: 0 };
          }
          results.byVertical[vertical].total++;
          results.byVertical[vertical].correct += score / 100;
        });

        // Update role scores
        question.roles.forEach(role => {
          if (!results.byRole[role]) {
            results.byRole[role] = { correct: 0, total: 0, percentage: 0 };
          }
          results.byRole[role].total++;
          results.byRole[role].correct += score / 100;
        });
      }

      // Calculate percentages
      results.overall.percentage = (results.overall.correct / results.overall.total) * 100;

      Object.values(results.byTopic).forEach(score => {
        score.percentage = (score.correct / score.total) * 100;
      });

      Object.values(results.byVertical).forEach(score => {
        score.percentage = (score.correct / score.total) * 100;
      });

      Object.values(results.byRole).forEach(score => {
        score.percentage = (score.correct / score.total) * 100;
      });

      // Save results to user history
      await User.findByIdAndUpdate(user._id, {
        $push: {
          testResults: {
            score: results.overall.percentage,
            date: new Date(),
            details: results
          }
        }
      });

      res.json(results);
    } catch (error) {
      console.error('Error processing test results:', error);
      res.status(500).json({ error: 'Failed to process test results' });
    }
  } catch (error) {
    console.error('Submit practice test error:', error);
    res.status(500).json({ error: 'Failed to submit practice test' });
  }
};
