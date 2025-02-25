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

// Interface for holistic feedback
export interface HolisticFeedback {
  score: number;
  feedback: string;
}

// Interface for grading result
export interface GradingResult {
  score: number;
  conceptsFeedback: ConceptFeedback[];
  holisticFeedback?: HolisticFeedback;
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
   * Grade a written answer using ChatGPT for holistic assessment and rubric for detailed feedback
   */
  public async gradeWrittenAnswer(userAnswer: string, question: IQuestion): Promise<GradingResult> {
    try {
      // If OpenAI is not configured, fall back to exact matching
      if (!openai) {
        const score = userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim() ? 100 : 0;
        return { score, conceptsFeedback: [] };
      }

      // Remove markdown formatting from the correct answer
      const cleanedAnswer = question.answer.replace(/\*\*/g, '');

      // Get holistic feedback from ChatGPT
      const holisticFeedback = await this.getHolisticGradeFromChatGPT(
        userAnswer, 
        question.text, 
        cleanedAnswer, 
        question.explanation
      );

      // If no rubric exists, return just the holistic feedback
      if (!question.rubric || !question.rubric.criteria || question.rubric.criteria.length === 0) {
        return { 
          score: holisticFeedback.score, 
          conceptsFeedback: [],
          holisticFeedback 
        };
      }

      // Ensure all rubric criteria have proper descriptions
      const enhancedRubric = this.ensureRubricDescriptions(question.rubric);
      
      // Adjust weights based on industry context if applicable
      const adjustedRubric = this.adjustConceptWeightsByIndustry(enhancedRubric, question.text, cleanedAnswer);
      
      // Extract key concepts from the student's answer
      const extractedConcepts = await this.extractConceptsFromAnswer(userAnswer, cleanedAnswer, adjustedRubric);
      
      // Evaluate those concepts against the rubric
      const rubricResult = await this.evaluateAgainstRubric(userAnswer, cleanedAnswer, adjustedRubric, extractedConcepts);
      
      // Calculate a balanced score that considers both holistic and rubric-based evaluations
      // This gives more weight to the detailed rubric evaluation while still considering the holistic assessment
      const balancedScore = Math.round((rubricResult.score * 0.7) + (holisticFeedback.score * 0.3));
      
      // Return combined result with the balanced score
      return {
        score: balancedScore,
        conceptsFeedback: rubricResult.conceptsFeedback,
        holisticFeedback
      };
    } catch (error) {
      console.error('Error in grading:', error);
      
      // Fall back to legacy grading if both approaches fail
      try {
        const score = await this.legacyGradeWrittenAnswer(userAnswer, question.answer.replace(/\*\*/g, ''));
        return { score, conceptsFeedback: [] };
      } catch (fallbackError) {
        console.error('Error in fallback grading:', fallbackError);
        return { score: 0, conceptsFeedback: [] };
      }
    }
  }

  /**
   * Extract industry context from question and answer
   */
  private extractIndustryContext(questionText: string, correctAnswer: string): string {
    // List of industry keywords to look for
    const industryKeywords: Record<string, string[]> = {
      'biotech': ['biotech', 'pharmaceutical', 'drug development', 'clinical trial', 'pipeline', 'therapeutic', 'FDA', 'regulatory approval'],
      'healthcare': ['healthcare', 'hospital', 'medical device', 'patient', 'reimbursement', 'Medicare', 'Medicaid'],
      'technology': ['technology', 'software', 'hardware', 'SaaS', 'subscription', 'user', 'platform', 'digital'],
      'financial': ['bank', 'insurance', 'asset management', 'wealth management', 'capital markets', 'trading', 'broker'],
      'energy': ['energy', 'oil', 'gas', 'renewable', 'solar', 'wind', 'power', 'utility'],
      'real estate': ['real estate', 'property', 'REIT', 'commercial', 'residential', 'leasing', 'development'],
      'retail': ['retail', 'consumer', 'e-commerce', 'store', 'merchandise', 'inventory'],
      'manufacturing': ['manufacturing', 'industrial', 'equipment', 'machinery', 'production'],
      'private equity': ['private equity', 'LBO', 'leveraged buyout', 'portfolio company', 'fund', 'limited partner'],
      'venture capital': ['venture capital', 'startup', 'early stage', 'growth stage', 'funding round', 'series']
    };
    
    // Combine question and answer text for analysis
    const combinedText = (questionText + ' ' + correctAnswer).toLowerCase();
    
    // Identify industries mentioned
    const detectedIndustries: string[] = [];
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => combinedText.includes(keyword.toLowerCase()))) {
        detectedIndustries.push(industry);
      }
    }
    
    // Generate context based on detected industries
    if (detectedIndustries.length > 0) {
      return `This question relates to the ${detectedIndustries.join(', ')} industry/industries. 
      When evaluating answers in this context, consider industry-specific metrics, terminology, and analytical approaches.`;
    }
    
    return "No specific industry context detected. Evaluate using general investment banking standards.";
  }

  /**
   * Get a holistic grade from ChatGPT
   */
  private async getHolisticGradeFromChatGPT(
    userAnswer: string,
    questionText: string,
    correctAnswer: string,
    explanation: string
  ): Promise<HolisticFeedback> {
    try {
      if (!openai) {
        return { score: 0, feedback: "AI grading unavailable" };
      }

      // Extract industry context from the question and answer
      const industryContext = this.extractIndustryContext(questionText, correctAnswer);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert grader for investment banking technical questions with deep knowledge of industry-specific standards and metrics. Your task is to holistically evaluate a student's answer to a technical question.

Provide a comprehensive assessment that considers:
1. Technical accuracy and understanding of concepts
2. Completeness of the answer
3. Quality of analysis and reasoning
4. Practical application of concepts
5. Industry-specific knowledge and terminology
6. Appropriate use of metrics and analytical frameworks for the specific industry context

Important grading guidelines:
- Value industry-specific metrics and approaches over generic ones
- Recognize that there are multiple valid approaches to financial analysis depending on the industry context
- Credit answers that demonstrate nuanced understanding of industry dynamics, even if they differ from the model answer
- Consider implied concepts and knowledge, not just explicit statements
- Evaluate the sophistication of the analysis rather than just matching keywords

Return your evaluation as a JSON object with:
1. A numeric score (0-100)
2. Detailed feedback explaining the score and highlighting strengths and areas for improvement

Format:
{
  "score": number,
  "feedback": "detailed explanation"
}`
          },
          {
            role: "user",
            content: `What grade would you give this answer, considering the following provided question, correct answer, explanation, and industry context?

Question: ${questionText}

Correct Answer: ${correctAnswer}

Explanation: ${explanation}

Industry Context: ${industryContext}

Student's Answer: ${userAnswer}

Provide a holistic grade (0-100) and detailed feedback. Be sure to consider industry-specific approaches and metrics in your evaluation.`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content?.trim() || "{}";
      try {
        const result = JSON.parse(content);
        return {
          score: typeof result.score === 'number' ? Math.min(100, Math.max(0, result.score)) : 0,
          feedback: result.feedback || "No feedback provided"
        };
      } catch (error) {
        console.error('Error parsing holistic grading JSON:', error, content);
        // Try to extract a score from the raw content if JSON parsing fails
        const scoreMatch = content.match(/score["\s:]+(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        return {
          score: Math.min(100, Math.max(0, score)),
          feedback: "Error parsing AI feedback. Please try again."
        };
      }
    } catch (error) {
      console.error('Error getting holistic grade:', error);
      return { score: 0, feedback: "Failed to get AI feedback" };
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
      // General financial concepts
      "Operational Synergies": "Identifies specific operational benefits like cost savings, cross-selling opportunities, shared services, or technology integration",
      "Financial Synergies": "Discusses financial benefits such as improved multiples, cash flow stability, capital structure optimization, or tax advantages",
      "Integration Challenges": "Addresses potential difficulties in merging different company cultures, systems, or operational models",
      "Diversity of Revenue Models": "Recognizes and analyzes the implications of different revenue approaches between companies",
      "Technical Accuracy": "Demonstrates correct application of financial concepts, terminology, and analytical frameworks",
      "Completeness": "Covers all key aspects of the question with sufficient depth and supporting rationale",
      "Strategic Thinking": "Shows consideration of multiple scenarios, risk assessment, and long-term implications",
      "Practical Implementation": "Addresses real-world constraints, implementation challenges, and operational feasibility",
      "Revenue synergies": "Identifies and explains potential revenue benefits from the acquisition",
      "Cost synergies": "Discusses cost reductions and operational efficiencies gained post-acquisition",
      "Integration costs": "Analyzes the costs involved in achieving synergies and potential risks",
      "Strategic alignment": "Evaluates how the acquisition fits within the strategic objectives of the parent company",
      "Sensitivity analysis": "Includes the approach to test various scenarios and their impacts on synergies",
      
      // LBO-specific concepts
      "Debt Servicing Analysis": "Evaluates the target's ability to service debt under various interest rate scenarios, including analysis of interest coverage ratios and cash flow stability",
      "Exit Multiples": "Analyzes how exit valuations might be affected by market conditions and interest rate environments",
      "Market Conditions": "Considers broader economic factors and their impact on the LBO's feasibility and returns",
      "Operational Considerations": "Addresses how operational improvements can offset the impact of higher interest costs",
      "Risk Assessment": "Includes stress-testing of the financial model under various interest rate scenarios",
      
      // Biotech/Healthcare-specific concepts
      "Pipeline Valuation": "Evaluates the value of drug candidates at different stages of development, considering probability of success and market potential",
      "Clinical Trial Analysis": "Assesses the design, results, and implications of clinical trials for valuation",
      "Regulatory Considerations": "Addresses the impact of regulatory approvals, timelines, and risks on company valuation",
      "R&D Efficiency": "Analyzes the company's research productivity relative to spending",
      "Cash Burn Rate": "Evaluates the sustainability of the company's spending relative to its cash reserves",
      "Market Exclusivity": "Considers patent protection, orphan drug status, and other factors affecting market exclusivity periods"
    };

    // Return the mapped description or a generic one based on the concept name
    return conceptDescriptions[concept] || 
      `Demonstrates understanding and application of ${concept.toLowerCase()} in the context of the question`;
  }

  /**
   * Adjust concept weights based on industry context
   */
  private adjustConceptWeightsByIndustry(
    rubric: { criteria: Array<{ concept: string; description: string; weight: number; }> },
    questionText: string,
    correctAnswer: string
  ): { criteria: Array<{ concept: string; description: string; weight: number; }> } {
    // Extract industry context
    const combinedText = (questionText + ' ' + correctAnswer).toLowerCase();
    
    // Define industry-specific concept importance
    const biotechImportance: Record<string, number> = {
      'Pipeline Valuation': 1.3,
      'Clinical Trial Analysis': 1.3,
      'Regulatory Considerations': 1.2,
      'R&D Efficiency': 1.2,
      'Cash Burn Rate': 1.2,
      'Market Exclusivity': 1.2,
      'PEG Ratio': 0.8,
      'P/E Ratio': 0.7,
      'Debt Servicing': 0.8
    };
    
    const privateEquityImportance: Record<string, number> = {
      'Debt Servicing Analysis': 1.3,
      'Operational Improvements': 1.3,
      'Exit Multiples': 1.2,
      'Market Conditions': 1.2,
      'Risk Assessment': 1.2,
      'Leverage Ratios': 1.2,
      'Cash Flow Analysis': 1.2
    };
    
    // Check if any industry keywords are present
    let importanceMap: Record<string, number> | null = null;
    
    if (combinedText.includes('biotech')) {
      importanceMap = biotechImportance;
    } else if (combinedText.includes('private equity') || combinedText.includes('lbo') || combinedText.includes('leveraged buyout')) {
      importanceMap = privateEquityImportance;
    }
    
    // If no specific industry detected, return original rubric
    if (!importanceMap) {
      return rubric;
    }
    
    // Adjust weights based on industry
    const adjustedCriteria = rubric.criteria.map(criterion => {
      const conceptLower = criterion.concept.toLowerCase();
      let adjustmentFactor = 1.0;
      
      // Check for concept matches in the industry importance map
      // We know importanceMap is not null here because we checked above
      for (const [conceptKey, factor] of Object.entries(importanceMap as Record<string, number>)) {
        if (conceptLower.includes(conceptKey.toLowerCase())) {
          adjustmentFactor = factor;
          break;
        }
      }
      
      // Apply adjustment factor to weight
      const adjustedWeight = Math.round(criterion.weight * adjustmentFactor);
      
      return {
        ...criterion,
        weight: adjustedWeight
      };
    });
    
    // Normalize weights to ensure they sum to 100
    const totalWeight = adjustedCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    const normalizedCriteria = adjustedCriteria.map(criterion => ({
      ...criterion,
      weight: Math.round((criterion.weight / totalWeight) * 100)
    }));
    
    // Ensure weights sum to exactly 100 by adjusting the first criterion if needed
    const finalSum = normalizedCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (finalSum !== 100 && normalizedCriteria.length > 0) {
      normalizedCriteria[0].weight += (100 - finalSum);
    }
    
    return { criteria: normalizedCriteria };
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

      // Extract industry context
      const industryContext = this.extractIndustryContext(userAnswer, correctAnswer);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert in financial analysis and investment banking with deep knowledge of industry-specific metrics and approaches. Your task is to extract key concepts from a student's answer to a technical question.
            
            For each concept in the provided rubric, identify specific phrases or sentences from the student's answer that relate to that concept.
            
            Important guidelines:
            - Be generous in your interpretation - look for conceptual matches rather than exact terminology
            - Recognize implied concepts even when they're not explicitly stated
            - Consider industry-specific terminology and approaches that may be equivalent to the concepts
            - Look for sophisticated analysis that demonstrates understanding, not just keyword matching
            - Identify both direct mentions and indirect demonstrations of concept understanding
            
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
            
            Industry Context: ${industryContext}
            
            Student's Answer: ${userAnswer}
            
            Rubric Concepts to Extract:
            ${rubric.criteria.map(c => `- ${c.concept}: ${c.description}`).join('\n')}
            
            Extract relevant phrases for each concept, being generous in identifying both explicit and implicit demonstrations of understanding.`
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

      // Extract industry context
      const industryContext = this.extractIndustryContext(userAnswer, correctAnswer);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert grader for investment banking technical questions with deep knowledge of industry-specific standards and metrics. You will evaluate how well a student's answer addresses key concepts from a grading rubric.

For each concept in the rubric:
1. Determine if the concept is addressed at all (Yes/No)
2. If addressed, evaluate the quality on a scale of 0-100%:
   - 90-100%: Exceptional - Comprehensive, sophisticated, and insightful treatment
   - 70-89%: Good - Solid understanding with some depth and specificity
   - 50-69%: Adequate - Basic understanding with limited depth or specificity
   - 1-49%: Poor - Minimal or superficial mention without meaningful analysis
   - 0%: Not addressed at all

3. Provide specific feedback explaining your evaluation, including:
   - What the student did well regarding this concept (with direct quotes)
   - What was missing or could be improved (with specific suggestions)
   - How the student's approach compares to industry standards

Important grading guidelines:
- Value sophisticated analysis over simple keyword matching
- Recognize implied concepts even when they're not explicitly stated
- Consider industry-specific terminology and approaches
- Evaluate the depth of understanding rather than just the presence of terms
- Be consistent in your scoring across different concepts
- Provide actionable, specific feedback that references the student's exact phrasing

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

Industry Context: ${industryContext}

Rubric Criteria:
${JSON.stringify(rubric.criteria)}

Extracted Concepts from Student's Answer:
${JSON.stringify(extractedConcepts)}

Evaluate each concept in the rubric, determining whether it's adequately addressed and providing specific feedback. Be sure to consider industry-specific approaches and metrics in your evaluation.`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      // Parse the response
      const content = response.choices[0].message.content?.trim() || "{}";
      let evaluation: any[] = [];
      try {
        const parsedContent = JSON.parse(content);
        if (Array.isArray(parsedContent)) {
          evaluation = parsedContent;
        } else if (parsedContent.evaluations && Array.isArray(parsedContent.evaluations)) {
          evaluation = parsedContent.evaluations;
        } else {
          console.warn('Unexpected evaluation format:', parsedContent);
        }
      } catch (error) {
        console.error('Error parsing evaluation JSON:', error, content);
      }
      
      // Calculate score based on quality percentage of each concept
      let score = 0;
      const conceptsFeedback: ConceptFeedback[] = [];
      
      for (const item of evaluation) {
        const criterion = rubric.criteria.find(c => c.concept === item.concept);
        if (criterion) {
          const weight = criterion.weight;
          const qualityPercentage = typeof item.qualityPercentage === 'number' ? 
            item.qualityPercentage : (item.addressed ? 100 : 0);
          
          // Calculate weighted score based on quality percentage
          score += (qualityPercentage / 100) * weight;
          
          conceptsFeedback.push({
            concept: item.concept,
            addressed: !!item.addressed,
            qualityPercentage: qualityPercentage,
            feedback: item.feedback || '',
            weight: weight,
            description: criterion.description
          });
        }
      }
      
      // If we're missing any concepts, use the fallback evaluation for those
      if (conceptsFeedback.length < rubric.criteria.length) {
        const missingCriteria = rubric.criteria.filter(
          criterion => !conceptsFeedback.some(cf => cf.concept === criterion.concept)
        );
        
        if (missingCriteria.length > 0) {
          // Create a partial fallback just for the missing criteria
          const partialFallback = await this.createPartialFallbackEvaluation(
            userAnswer, 
            correctAnswer, 
            { criteria: missingCriteria }, 
            extractedConcepts
          );
          
          // Add the missing criteria feedback
          conceptsFeedback.push(...partialFallback.conceptsFeedback);
          
          // Update the score
          score = conceptsFeedback.reduce(
            (total, cf) => total + ((cf.qualityPercentage / 100) * cf.weight), 
            0
          );
        }
      }
      
      return { score, conceptsFeedback };
    } catch (error) {
      console.error('Error in rubric evaluation:', error);
      return this.createFallbackEvaluation(userAnswer, correctAnswer, rubric, extractedConcepts);
    }
  }

  /**
   * Create fallback evaluation when the primary evaluation fails
   */
  private async createFallbackEvaluation(
    userAnswer: string,
    correctAnswer: string,
    rubric: { criteria: Array<{ concept: string; description: string; weight: number; }> },
    extractedConcepts: Record<string, string[]>
  ): Promise<GradingResult> {
    try {
      // First try to get a holistic assessment to distribute across concepts
      const holisticFeedback = await this.getHolisticGradeFromChatGPT(
        userAnswer, 
        "", // We don't need the question text here
        correctAnswer, 
        ""  // We don't need the explanation here
      );
      
      // Create a map of concept keywords to help distribute the holistic feedback
      const conceptKeywords = rubric.criteria.reduce((map, criterion) => {
        // Extract key terms from the concept name and description
        const keyTerms = [
          ...criterion.concept.toLowerCase().split(/\s+/),
          ...(criterion.description ? criterion.description.toLowerCase().split(/\s+/) : [])
        ].filter(term => term.length > 3); // Only use terms with more than 3 characters
        
        map[criterion.concept] = keyTerms;
        return map;
      }, {} as Record<string, string[]>);
      
      // Calculate a relevance score for each concept based on the holistic feedback
      const relevanceScores = rubric.criteria.reduce((map, criterion) => {
        const keywords = conceptKeywords[criterion.concept] || [];
        let relevance = 0;
        
        // Count how many keywords from this concept appear in the holistic feedback
        keywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = (holisticFeedback.feedback.match(regex) || []).length;
          relevance += matches;
        });
        
        // Ensure a minimum relevance score
        map[criterion.concept] = Math.max(1, relevance);
        return map;
      }, {} as Record<string, number>);
      
      // Calculate the total relevance score
      const totalRelevance = Object.values(relevanceScores).reduce((sum, score) => sum + score, 0);
      
      // Distribute the holistic score across concepts based on relevance and extracted phrases
      const conceptsFeedback = rubric.criteria.map(criterion => {
        const hasExtractedConcepts = extractedConcepts[criterion.concept]?.length > 0;
        const relevanceRatio = relevanceScores[criterion.concept] / totalRelevance;
        
        // Calculate a quality percentage based on the holistic score, relevance, and extracted phrases
        // If we have extracted phrases, give a boost to the score
        const extractedBoost = hasExtractedConcepts ? 1.2 : 0.8;
        let qualityPercentage = Math.round(holisticFeedback.score * relevanceRatio * extractedBoost);
        
        // Ensure the quality percentage is within bounds
        qualityPercentage = Math.min(100, Math.max(0, qualityPercentage));
        
        // Generate specific feedback based on the holistic assessment
        let feedback = "";
        if (hasExtractedConcepts) {
          const phrases = extractedConcepts[criterion.concept];
          feedback = `The answer addresses this concept with phrases like: "${phrases.join('", "')}". `;
          
          // Add a portion of the holistic feedback that might be relevant
          if (holisticFeedback.feedback.length > 0) {
            // Find sentences in the holistic feedback that contain keywords from this concept
            const keywords = conceptKeywords[criterion.concept] || [];
            const sentences = holisticFeedback.feedback.split(/\.\s+/);
            
            const relevantSentences = sentences.filter(sentence => 
              keywords.some(keyword => 
                sentence.toLowerCase().includes(keyword)
              )
            );
            
            if (relevantSentences.length > 0) {
              feedback += `Overall assessment: ${relevantSentences.join('. ')}.`;
            } else {
              // If no specific sentences match, add a more specific assessment
              feedback += `To strengthen this aspect, consider providing more detailed analysis of how this specifically impacts the financial outcomes.`;
            }
          }
        } else {
          feedback = `The answer does not clearly address this concept. `;
          
          // Add suggestions based on the correct answer
          const correctAnswerLower = correctAnswer.toLowerCase();
          if (correctAnswerLower.includes(criterion.concept.toLowerCase())) {
            // Find sentences in the correct answer that mention this concept
            const sentences = correctAnswer.split(/\.\s+/);
            const relevantSentences = sentences.filter(sentence => 
              sentence.toLowerCase().includes(criterion.concept.toLowerCase())
            );
            
            if (relevantSentences.length > 0) {
              feedback += `The correct answer addresses this by explaining: "${relevantSentences[0]}".`;
            }
          }
        }
        
        return {
          concept: criterion.concept,
          addressed: hasExtractedConcepts,
          qualityPercentage,
          feedback,
          weight: criterion.weight,
          description: criterion.description
        };
      });
      
      // Calculate the final score based on the weighted average of concept scores
      const score = conceptsFeedback.reduce(
        (total, cf) => total + ((cf.qualityPercentage / 100) * cf.weight), 
        0
      );
      
      return { score, conceptsFeedback };
    } catch (error) {
      console.error('Error in fallback evaluation:', error);
      
      // If everything fails, create a very basic fallback
      const conceptsFeedback = rubric.criteria.map(criterion => {
        const hasExtractedConcepts = extractedConcepts[criterion.concept]?.length > 0;
        
        return {
          concept: criterion.concept,
          addressed: hasExtractedConcepts,
          qualityPercentage: hasExtractedConcepts ? 50 : 0,
          feedback: hasExtractedConcepts 
            ? `The answer includes some elements related to this concept.` 
            : `The answer does not appear to address this concept.`,
          weight: criterion.weight,
          description: criterion.description
        };
      });
      
      const score = conceptsFeedback.reduce(
        (total, cf) => total + ((cf.qualityPercentage / 100) * cf.weight), 
        0
      );
      
      return { score, conceptsFeedback };
    }
  }

  /**
   * Create a partial fallback evaluation for missing criteria
   */
  private async createPartialFallbackEvaluation(
    userAnswer: string,
    correctAnswer: string,
    rubric: { criteria: Array<{ concept: string; description: string; weight: number; }> },
    extractedConcepts: Record<string, string[]>
  ): Promise<GradingResult> {
    // This is a simplified version of createFallbackEvaluation that only handles specific criteria
    const conceptsFeedback: ConceptFeedback[] = [];
    
    for (const criterion of rubric.criteria) {
      const hasExtractedConcepts = extractedConcepts[criterion.concept]?.length > 0;
      
      // Calculate a quality percentage based on extracted phrases and a base score
      // We'll use a more nuanced approach than the simple 50/0 split
      let qualityPercentage = 0;
      
      if (hasExtractedConcepts) {
        const phrases = extractedConcepts[criterion.concept];
        // More phrases = higher score, up to a reasonable limit
        qualityPercentage = Math.min(85, 40 + (phrases.length * 15));
      }
      
      // Generate specific feedback based on the extracted phrases
      let feedback = "";
      if (hasExtractedConcepts) {
        const phrases = extractedConcepts[criterion.concept];
        feedback = `The answer addresses this concept with phrases like: "${phrases.join('", "')}". `;
        
        // Add more specific suggestions for improvement
        feedback += `To strengthen this analysis, consider explaining how these elements specifically impact the financial outcomes and providing quantitative support where possible.`;
      } else {
        feedback = `The answer does not clearly address this concept. `;
        
        // Add suggestions based on the correct answer
        const correctAnswerLower = correctAnswer.toLowerCase();
        if (correctAnswerLower.includes(criterion.concept.toLowerCase())) {
          // Find sentences in the correct answer that mention this concept
          const sentences = correctAnswer.split(/\.\s+/);
          const relevantSentences = sentences.filter(sentence => 
            sentence.toLowerCase().includes(criterion.concept.toLowerCase())
          );
          
          if (relevantSentences.length > 0) {
            feedback += `The correct answer addresses this by explaining: "${relevantSentences[0]}".`;
          }
        }
      }
      
      conceptsFeedback.push({
        concept: criterion.concept,
        addressed: hasExtractedConcepts,
        qualityPercentage,
        feedback,
        weight: criterion.weight,
        description: criterion.description
      });
    }
    
    // Calculate score based on the weighted average
    const score = conceptsFeedback.reduce(
      (total, cf) => total + ((cf.qualityPercentage / 100) * cf.weight), 
      0
    );
    
    return { score, conceptsFeedback };
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

      const content = response.choices[0].message.content?.trim() || "0";
      const score = parseInt(content);
      return isNaN(score) ? 0 : Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Error grading written answer:', error);
      throw new Error('Failed to grade written answer');
    }
  }
}
