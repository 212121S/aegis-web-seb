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
            content: `You are an expert grader for advanced investment banking technical questions. Grade responses on a scale of 0-100 using these criteria:

1. Technical Accuracy (40%):
- Correct application of financial concepts
- Accurate technical terminology
- Sound analytical framework

2. Strategic Thinking (30%):
- Consideration of multiple scenarios
- Risk assessment and mitigation
- Long-term implications
- Market context awareness

3. Completeness (20%):
- Coverage of all key aspects
- Depth of analysis
- Supporting rationale

4. Practical Implementation (10%):
- Operational feasibility
- Implementation challenges
- Real-world constraints

For level 8 questions, answers should demonstrate:
- Integration of multiple domains
- Complex decision-making rationale
- Understanding of interconnected risks
- Practical implementation considerations

Return only the numeric score (0-100).`
          },
          {
            role: "user",
            content: `Grade this advanced technical answer on a scale of 0-100.
            
Correct Answer: ${correctAnswer}

Student's Answer: ${userAnswer}

Consider all evaluation criteria and provide only the final numeric score (0-100).`
          }
        ],
        temperature: 0.4,
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
