import { openai } from '../config/openai';

export class GradingService {
  private static instance: GradingService;

  private constructor() {}

  public static getInstance(): GradingService {
    if (!GradingService.instance) {
      GradingService.instance = new GradingService();
    }
    return GradingService.instance;
  }

  public async gradeWrittenAnswer(userAnswer: string, correctAnswer: string): Promise<number> {
    try {
      // If OpenAI is not configured, fall back to exact matching
      if (!openai) {
        return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ? 100 : 0;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert grader for investment banking technical questions. Grade the user's answer on a scale of 0-100 based on accuracy, completeness, and depth of understanding compared to the correct answer. Return only the numeric score."
          },
          {
            role: "user",
            content: `Please grade this answer on a scale of 0-100.
            
Correct Answer: ${correctAnswer}

Student's Answer: ${userAnswer}

Provide only the numeric score (0-100).`
          }
        ],
        temperature: 0.3,
        max_tokens: 5
      });

      const score = parseInt(response.choices[0].message.content?.trim() || "0");
      return isNaN(score) ? 0 : Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Error grading written answer:', error);
      throw new Error('Failed to grade written answer');
    }
  }
}
