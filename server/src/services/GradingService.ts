import { openai } from '../config/openai';
import { IQuestion } from '../models/Question';

// Interface for concept feedback
export interface ConceptFeedback {
  concept: string;
  addressed: boolean;
  feedback: string;
  weight: number;
}

// Interface for grading result
export interface GradingResult {
  score: number;
  conceptsFeedback: ConceptFeedback[];
}

export class GradingService {
  private static instance: GradingService;

  private constructor() {}

  public static getInstance(): GradingService {
    if (!GradingService.instance) {
      GradingService.instance = new GradingService();
    }
    return GradingService.instance;
  }

  /**
   * Grade a written answer using a rubric if available, or fall back to legacy grading
   */
  public async gradeWrittenAnswer(userAnswer: string, question: IQuestion): Promise<GradingResult> {
    try {
      // If OpenAI is not configured or no rubric exists, fall back to legacy grading
      if (!openai || !question.rubric || !question.rubric.criteria || question.rubric.criteria.length === 0) {
        const score = await this.legacyGradeWrittenAnswer(userAnswer, question.answer);
        return { score, conceptsFeedback: [] };
      }

      // Use rubric-based grading with feedback
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert grader for investment banking technical questions. 
            You will be given a student's answer and a rubric of concepts they should mention.
            For each concept in the rubric:
            1. Determine if the student's answer adequately addresses it (Yes/No)
            2. Provide a brief explanation of why you made that determination
            
            Return your evaluation as a JSON array of objects with the format:
            [
              {
                "concept": "concept_name",
                "addressed": true/false,
                "feedback": "Brief explanation of why the concept was or wasn't adequately addressed"
              }
            ]`
          },
          {
            role: "user",
            content: `
            Student's Answer: ${userAnswer}
            
            Rubric Criteria:
            ${JSON.stringify(question.rubric.criteria)}
            
            Evaluate which concepts are adequately addressed in the student's answer and explain your reasoning.`
          }
        ],
        temperature: 1.0,
        response_format: { type: "json_object" }
      });

      // Parse the response
      const content = response.choices[0].message.content?.trim() || "{}";
      let evaluation;
      try {
        evaluation = JSON.parse(content);
        // Ensure evaluation is an array
        if (!Array.isArray(evaluation)) {
          if (evaluation.evaluations && Array.isArray(evaluation.evaluations)) {
            evaluation = evaluation.evaluations;
          } else {
            console.warn('Unexpected evaluation format:', evaluation);
            evaluation = [];
          }
        }
      } catch (error) {
        console.error('Error parsing evaluation JSON:', error, content);
        evaluation = [];
      }
      
      // Calculate score based on weights of addressed concepts
      let score = 0;
      const conceptsFeedback: ConceptFeedback[] = [];
      
      for (const item of evaluation) {
        const criterion = question.rubric.criteria.find(c => c.concept === item.concept);
        if (criterion) {
          const weight = criterion.weight;
          
          if (item.addressed) {
            score += weight;
          }
          
          conceptsFeedback.push({
            concept: item.concept,
            addressed: item.addressed,
            feedback: item.feedback,
            weight: weight
          });
        }
      }
      
      // Ensure all criteria are included in the feedback
      for (const criterion of question.rubric.criteria) {
        if (!conceptsFeedback.some(cf => cf.concept === criterion.concept)) {
          conceptsFeedback.push({
            concept: criterion.concept,
            addressed: false,
            feedback: "This concept was not evaluated.",
            weight: criterion.weight
          });
        }
      }
      
      return { score, conceptsFeedback };
    } catch (error) {
      console.error('Error in rubric-based grading:', error);
      // Fall back to legacy grading if rubric-based grading fails
      const score = await this.legacyGradeWrittenAnswer(userAnswer, question.answer);
      return { score, conceptsFeedback: [] };
    }
  }

  /**
   * Legacy method for grading written answers without a rubric
   */
  private async legacyGradeWrittenAnswer(userAnswer: string, correctAnswer: string): Promise<number> {
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
        temperature: 1.0,
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
