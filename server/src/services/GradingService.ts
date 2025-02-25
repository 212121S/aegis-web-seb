import { openai } from '../config/openai';
import { IQuestion } from '../models/Question';

// Interface for concept feedback
export interface ConceptFeedback {
  concept: string;
  addressed: boolean;
  qualityPercentage: number; // 0-100 scale
  feedback: string;
  weight: number;
  description?: string;
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

      // Ensure all rubric criteria have proper descriptions
      const enhancedRubric = this.ensureRubricDescriptions(question.rubric);
      
      // First extract key concepts from the student's answer
      const extractedConcepts = await this.extractConceptsFromAnswer(userAnswer, question.answer, enhancedRubric);
      
      // Then evaluate those concepts against the rubric
      return await this.evaluateAgainstRubric(userAnswer, question.answer, enhancedRubric, extractedConcepts);
    } catch (error) {
      console.error('Error in rubric-based grading:', error);
      // Fall back to legacy grading if rubric-based grading fails
      const score = await this.legacyGradeWrittenAnswer(userAnswer, question.answer);
      return { score, conceptsFeedback: [] };
    }
  }

  /**
   * Ensure all rubric criteria have proper descriptions
   */
  private ensureRubricDescriptions(rubric: { criteria: Array<{ concept: string; description: string; weight: number; }> }): 
    { criteria: Array<{ concept: string; description: string; weight: number; }> } {
    
    const enhancedCriteria = rubric.criteria.map(criterion => {
      // If description is missing or just "N/A", generate a better one
      if (!criterion.description || criterion.description === "N/A") {
        return {
          ...criterion,
          description: this.generateDescriptionForConcept(criterion.concept)
        };
      }
      return criterion;
    });

    return { criteria: enhancedCriteria };
  }

  /**
   * Generate a description for a concept if one is missing
   */
  private generateDescriptionForConcept(concept: string): string {
    // Map of common concepts to descriptions
    const conceptDescriptions: Record<string, string> = {
      "Operational Synergies": "Identifies specific operational benefits like cost savings, cross-selling opportunities, shared services, or technology integration",
      "Financial Synergies": "Discusses financial benefits such as improved multiples, cash flow stability, capital structure optimization, or tax advantages",
      "Integration Challenges": "Addresses potential difficulties in merging different company cultures, systems, or operational models",
      "Diversity of Revenue Models": "Recognizes and analyzes the implications of different revenue approaches between companies",
      "Technical Accuracy": "Demonstrates correct application of financial concepts, terminology, and analytical frameworks",
      "Completeness": "Covers all key aspects of the question with sufficient depth and supporting rationale",
      "Strategic Thinking": "Shows consideration of multiple scenarios, risk assessment, and long-term implications",
      "Practical Implementation": "Addresses real-world constraints, implementation challenges, and operational feasibility"
    };

    // Return the mapped description or a generic one based on the concept name
    return conceptDescriptions[concept] || 
      `Demonstrates understanding and application of ${concept.toLowerCase()} in the context of the question`;
  }

  /**
   * Extract key concepts from the student's answer
   */
  private async extractConceptsFromAnswer(
    userAnswer: string, 
    correctAnswer: string, 
    rubric: { criteria: Array<{ concept: string; description: string; weight: number; }> }
  ): Promise<Record<string, string[]>> {
    try {
      if (!openai) {
        return {};
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert in financial analysis and investment banking. Your task is to extract key concepts from a student's answer to a technical question.
            
            For each concept in the provided rubric, identify specific phrases or sentences from the student's answer that relate to that concept.
            Be generous in your interpretation - look for conceptual matches rather than exact terminology.
            
            Return your analysis as a JSON object where:
            - Each key is a concept name from the rubric
            - Each value is an array of quoted phrases from the student's answer that relate to that concept
            
            Example format:
            {
              "Operational Synergies": ["phrase from answer", "another relevant phrase"],
              "Financial Synergies": ["relevant phrase about financial benefits"]
            }`
          },
          {
            role: "user",
            content: `
            Question Context: ${correctAnswer}
            
            Student's Answer: ${userAnswer}
            
            Rubric Concepts to Extract:
            ${rubric.criteria.map(c => `- ${c.concept}: ${c.description}`).join('\n')}
            
            Extract relevant phrases for each concept.`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content?.trim() || "{}";
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error('Error parsing concept extraction JSON:', error, content);
        return {};
      }
    } catch (error) {
      console.error('Error extracting concepts:', error);
      return {};
    }
  }

  /**
   * Evaluate the extracted concepts against the rubric
   */
  private async evaluateAgainstRubric(
    userAnswer: string,
    correctAnswer: string,
    rubric: { criteria: Array<{ concept: string; description: string; weight: number; }> },
    extractedConcepts: Record<string, string[]>
  ): Promise<GradingResult> {
    try {
      if (!openai) {
        // Create default feedback if OpenAI is not available
        const conceptsFeedback = rubric.criteria.map(criterion => ({
          concept: criterion.concept,
          addressed: false,
          qualityPercentage: 0,
          feedback: "Unable to evaluate without AI services.",
          weight: criterion.weight
        }));
        return { score: 0, conceptsFeedback };
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert grader for investment banking technical questions. You will evaluate how well a student's answer addresses key concepts from a grading rubric.

For each concept in the rubric:
1. Determine if the concept is addressed at all (Yes/No)
2. If addressed, evaluate the quality on a scale of 0-100%:
   - 90-100%: Exceptional - Comprehensive, sophisticated, and insightful treatment
   - 70-89%: Good - Solid understanding with some depth and specificity
   - 50-69%: Adequate - Basic understanding with limited depth or specificity
   - 1-49%: Poor - Minimal or superficial mention without meaningful analysis
   - 0%: Not addressed at all

3. Provide specific feedback explaining your evaluation, including:
   - What the student did well regarding this concept
   - What was missing or could be improved
   - References to specific content from the student's answer

Be fair but rigorous in your evaluation. A concept is only fully addressed (90-100%) if it demonstrates comprehensive understanding and sophisticated analysis.

Return your evaluation as a JSON array of objects with the format:
[
  {
    "concept": "concept_name",
    "addressed": true/false,
    "qualityPercentage": number (0-100),
    "feedback": "Specific explanation with references to the student's answer"
  }
]`
          },
          {
            role: "user",
            content: `
Student's Answer: ${userAnswer}

Correct Answer Context: ${correctAnswer}

Rubric Criteria:
${JSON.stringify(rubric.criteria)}

Extracted Concepts from Student's Answer:
${JSON.stringify(extractedConcepts)}

Evaluate each concept in the rubric, determining whether it's adequately addressed and providing specific feedback.`
          }
        ],
        temperature: 0.7,
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
      
      // Calculate score based on quality percentage of each concept
      let score = 0;
      const conceptsFeedback: ConceptFeedback[] = [];
      
      for (const item of evaluation) {
        const criterion = rubric.criteria.find(c => c.concept === item.concept);
        if (criterion) {
          const weight = criterion.weight;
          const qualityPercentage = item.qualityPercentage || (item.addressed ? 100 : 0);
          
          // Calculate weighted score based on quality percentage
          score += (qualityPercentage / 100) * weight;
          
          conceptsFeedback.push({
            concept: item.concept,
            addressed: item.addressed,
            qualityPercentage: qualityPercentage,
            feedback: item.feedback,
            weight: weight,
            description: criterion.description
          });
        }
      }
      
      // Ensure all criteria are included in the feedback
      for (const criterion of rubric.criteria) {
        if (!conceptsFeedback.some(cf => cf.concept === criterion.concept)) {
          // For any missing criteria, make a second attempt to evaluate
          const hasExtractedConcepts = extractedConcepts[criterion.concept]?.length > 0;
          const qualityPercentage = hasExtractedConcepts ? 50 : 0; // Default to 50% quality if we found some phrases
          
          conceptsFeedback.push({
            concept: criterion.concept,
            addressed: hasExtractedConcepts,
            qualityPercentage: qualityPercentage,
            feedback: hasExtractedConcepts 
              ? `Based on extracted phrases, this concept appears to be partially addressed, but a detailed evaluation couldn't be performed.` 
              : `The answer does not appear to address this concept adequately.`,
            weight: criterion.weight,
            description: criterion.description
          });
          
          // Add the weighted score based on quality percentage
          score += (qualityPercentage / 100) * criterion.weight;
        }
      }
      
      return { score, conceptsFeedback };
    } catch (error) {
      console.error('Error in rubric evaluation:', error);
      
      // Create fallback feedback if evaluation fails
      const conceptsFeedback = rubric.criteria.map(criterion => {
        // Check if we have extracted concepts for this criterion
        const hasExtractedConcepts = extractedConcepts[criterion.concept]?.length > 0;
        const qualityPercentage = hasExtractedConcepts ? 50 : 0; // Default to 50% quality if we found some phrases
        
        return {
          concept: criterion.concept,
          addressed: hasExtractedConcepts,
          qualityPercentage: qualityPercentage,
          feedback: hasExtractedConcepts 
            ? `Based on extracted phrases, this concept appears to be partially addressed, but a detailed evaluation couldn't be performed.` 
            : `The answer does not appear to address this concept adequately.`,
          weight: criterion.weight,
          description: criterion.description
        };
      });
      
      // Calculate fallback score based on quality percentages
      const score = conceptsFeedback.reduce((total, cf) => total + ((cf.qualityPercentage / 100) * cf.weight), 0);
      
      return { score, conceptsFeedback };
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
