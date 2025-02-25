import { Request, Response } from 'express';
import { InvestmentBank } from '../models/InvestmentBank';
import { QuestionGenerationService } from '../services/QuestionGenerationService';
import { User } from '../models/User';
import { Question, IQuestion } from '../models/Question';
import { Types } from 'mongoose';

interface UserDocument {
  _id: Types.ObjectId;
  subscription: {
    active: boolean;
  };
}

// Get all banks and their groups
export const getBanksAndGroups = async (_req: Request, res: Response): Promise<void> => {
  try {
    const banks = await InvestmentBank.find({ active: true })
      .select('name tier groups')
      .sort({ name: 1 });
    
    res.json(banks);
  } catch (error) {
    console.error('Error fetching banks and groups:', error);
    res.status(500).json({ error: 'Failed to fetch banks and groups' });
  }
};

// Get a specific bank by ID
export const getBankById = async (req: Request, res: Response): Promise<void> => {
  try {
    const bank = await InvestmentBank.findById(req.params.id);
    
    if (!bank) {
      res.status(404).json({ error: 'Bank not found' });
      return;
    }
    
    res.json(bank);
  } catch (error) {
    console.error('Error fetching bank:', error);
    res.status(500).json({ error: 'Failed to fetch bank' });
  }
};

// Generate IB interview questions
export const generateIBInterviewQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserDocument;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { bankId, groupId, count, questionType = 'multiple-choice' } = req.body;

    // Validate request parameters
    if (!bankId || !groupId || !count) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    if (count < 1 || count > 20) {
      res.status(400).json({ error: 'Invalid question count (1-20)' });
      return;
    }

    // Find the bank and group
    const bank = await InvestmentBank.findById(bankId);
    if (!bank) {
      res.status(404).json({ error: 'Bank not found' });
      return;
    }

    const group = bank.groups.find(g => g._id && g._id.toString() === groupId);
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Prepare parameters for question generation
    const verticals = ['Cross-Industry']; // Default to Cross-Industry
    const roles = [group.type]; // Use the group type as the role
    const topics = group.topics;
    const difficulty = [group.difficulty]; // Use the group's difficulty level

    // Generate questions
    const questionService = QuestionGenerationService.getInstance();
    let questions: IQuestion[] = [];

    // Determine question type
    const type = questionType === 'multiple-choice' ? 'multiple_choice' : 'open_ended';

    // Generate questions with enhanced bank-specific context
    questions = await questionService.generateQuestions({
      verticals,
      roles,
      topics,
      difficulty,
      count,
      useAI: true,
      type,
      // Add bank and group specific context
      bankContext: {
        bankName: bank.name,
        groupName: group.name,
        groupFullName: group.fullName,
        groupDescription: group.description
      }
    });

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
        roles: q.roles,
        bankSpecific: {
          bank: bank.name,
          group: group.name
        }
      })),
      config: {
        bank: bank.name,
        group: group.name,
        difficulty,
        count
      }
    };

    res.json(testSession);
  } catch (error) {
    console.error('Generate IB interview questions error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate IB interview questions' 
    });
  }
};
