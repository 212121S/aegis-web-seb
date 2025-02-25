import mongoose from 'mongoose';
import { Question, IQuestion } from '../models/Question';
import { openai, isOpenAIConfigured } from '../config/openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectToDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Generate a rubric for a question using OpenAI
const generateRubric = async (question: IQuestion): Promise<{
  criteria: Array<{
    concept: string;
    description: string;
    weight: number;
  }>;
} | null> => {
  if (!openai || !isOpenAIConfigured()) {
    console.warn('OpenAI is not configured, using default rubric');
    return generateDefaultRubric(question);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in creating grading rubrics for investment banking technical questions. 
          Given a question and its answer, create a rubric with 3-5 key concepts that a complete answer should address.
          
          The rubric should:
          1. Identify key concepts that a complete answer should address
          2. Provide a detailed description of what constitutes addressing each concept
          3. Assign weights to each concept based on importance (weights should sum to 100)
          4. Cover different aspects of a complete answer (e.g., theory, application, analysis)
          
          IMPORTANT GUIDELINES:
          - Each description must be specific and detailed (at least 15-20 words), explaining exactly what the student should mention to get credit for this concept
          - Descriptions should include specific examples, techniques, or approaches that would demonstrate mastery
          - Concepts should be distinct and non-overlapping
          - Weights should reflect the relative importance of each concept (more important concepts get higher weights)
          - The rubric should be designed to differentiate between superficial mentions and deep understanding
          
          Return your response as a JSON object with the following structure:
          {
            "criteria": [
              {
                "concept": "Key concept name",
                "description": "Detailed description of what should be mentioned to get credit for this concept",
                "weight": 25
              },
              ...
            ]
          }
          
          Example of good descriptions:
          - "Identifies specific operational benefits like cost savings, cross-selling opportunities, shared services, or technology integration, with quantitative estimates of synergy value"
          - "Discusses financial benefits such as improved multiples, cash flow stability, capital structure optimization, or tax advantages, with consideration of timing and risk factors"
          - "Addresses potential difficulties in merging different company cultures, systems, or operational models, with specific mitigation strategies for each challenge"
          - "Proposes a detailed implementation timeline with key milestones, resource requirements, and critical path analysis for the integration process"
          
          NEVER use "N/A" or vague descriptions. The descriptions should be detailed enough that they could be used to evaluate the quality of an answer on a percentage basis, not just whether a concept is mentioned or not.`
        },
        {
          role: 'user',
          content: `Create a grading rubric for the following question:
          
          Question: ${question.text}
          
          Answer: ${question.answer}
          
          Explanation: ${question.explanation}`
        }
      ],
      temperature: 1.0,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content?.trim() || '{}';
    const rubric = JSON.parse(content);

    // Validate the rubric
    if (!rubric.criteria || !Array.isArray(rubric.criteria)) {
      console.warn('Invalid rubric format, using default rubric');
      return generateDefaultRubric(question);
    }

    // Validate each criterion and ensure weights sum to 100
    let totalWeight = 0;
    const validCriteria = rubric.criteria.every(c => {
      if (!c.concept || !c.description || typeof c.weight !== 'number') return false;
      totalWeight += c.weight;
      return true;
    });

    if (!validCriteria || Math.abs(totalWeight - 100) > 5) {
      console.warn('Invalid criteria or weights don\'t sum to 100, using default rubric');
      return generateDefaultRubric(question);
    }

    return rubric;
  } catch (error) {
    console.error('Error generating rubric:', error);
    return generateDefaultRubric(question);
  }
};

// Generate a default rubric if OpenAI fails
const generateDefaultRubric = (question: IQuestion): {
  criteria: Array<{
    concept: string;
    description: string;
    weight: number;
  }>;
} => {
  // Try to extract key concepts from the question text and answer
  const questionText = question.text.toLowerCase();
  const answerText = question.answer.toLowerCase();
  
  // Check for common financial topics in the question and answer
  const topicChecks = [
    {
      concept: "Valuation Methodology",
      keywords: ["valuation", "dcf", "multiple", "discount", "cash flow", "terminal value"],
      description: "Demonstrates understanding of appropriate valuation methodologies, including DCF, multiples analysis, or other relevant approaches for the given scenario"
    },
    {
      concept: "Financial Analysis",
      keywords: ["financial", "ratio", "analysis", "balance sheet", "income statement", "cash flow statement", "metric"],
      description: "Applies relevant financial analysis techniques, including ratio analysis, trend analysis, or comparative analysis to evaluate financial performance"
    },
    {
      concept: "Market Assessment",
      keywords: ["market", "industry", "competitor", "competitive", "landscape", "trend", "growth"],
      description: "Evaluates market conditions, industry trends, competitive landscape, and growth opportunities that impact the business scenario"
    },
    {
      concept: "Risk Evaluation",
      keywords: ["risk", "downside", "uncertainty", "volatility", "mitigate", "hedge"],
      description: "Identifies key risks and uncertainties, including market risks, operational risks, and financial risks, with appropriate mitigation strategies"
    },
    {
      concept: "Strategic Implications",
      keywords: ["strategy", "strategic", "long-term", "synergy", "integration", "acquisition", "merger"],
      description: "Analyzes strategic implications, including long-term positioning, competitive advantage, and alignment with corporate objectives"
    },
    {
      concept: "Operational Considerations",
      keywords: ["operation", "operational", "implement", "execution", "process", "efficiency"],
      description: "Addresses operational aspects including implementation challenges, process improvements, and operational efficiencies"
    },
    {
      concept: "Capital Structure",
      keywords: ["capital", "debt", "equity", "leverage", "financing", "fund", "lbo"],
      description: "Evaluates optimal capital structure, including debt-equity mix, financing options, and impact on returns and risk profile"
    },
    {
      concept: "Stakeholder Impact",
      keywords: ["stakeholder", "shareholder", "investor", "management", "employee", "customer"],
      description: "Considers impacts on various stakeholders including shareholders, management, employees, customers, and other relevant parties"
    }
  ];
  
  // Find matching topics
  const matchedTopics = topicChecks.filter(topic => {
    return topic.keywords.some(keyword => 
      questionText.includes(keyword) || answerText.includes(keyword)
    );
  });
  
  // If we found at least 3 matching topics, use them
  if (matchedTopics.length >= 3) {
    // Take the top 4 topics (or fewer if we don't have 4)
    const selectedTopics = matchedTopics.slice(0, 4);
    
    // Calculate weights - more evenly distributed
    const baseWeight = Math.floor(100 / selectedTopics.length);
    const remainder = 100 - (baseWeight * selectedTopics.length);
    
    return {
      criteria: selectedTopics.map((topic, index) => ({
        concept: topic.concept,
        description: topic.description,
        weight: index === 0 ? baseWeight + remainder : baseWeight
      }))
    };
  }
  
  // Default generic rubric if we couldn't match specific topics
  return {
    criteria: [
      {
        concept: "Technical Accuracy",
        description: "Correct application of financial concepts, terminology, and analytical frameworks with precise calculations and appropriate methodologies",
        weight: 40
      },
      {
        concept: "Completeness",
        description: "Comprehensive coverage of all key aspects of the question with sufficient depth, supporting rationale, and consideration of relevant factors",
        weight: 30
      },
      {
        concept: "Strategic Thinking",
        description: "Demonstrates consideration of multiple scenarios, risk assessment and mitigation strategies, long-term implications, and market context awareness",
        weight: 20
      },
      {
        concept: "Practical Implementation",
        description: "Addresses real-world constraints, implementation challenges, operational feasibility, and practical considerations for executing the proposed solution",
        weight: 10
      }
    ]
  };
};

// Main function to add rubrics to questions
const addRubricsToQuestions = async (): Promise<void> => {
  try {
    // Find all open-ended questions without rubrics
    const questions = await Question.find({
      type: 'open_ended',
      rubric: { $exists: false }
    });

    console.log(`Found ${questions.length} open-ended questions without rubrics`);

    // Process questions in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(questions.length / batchSize)}`);

      // Process each question in the batch
      const promises = batch.map(async (question) => {
        try {
          const rubric = await generateRubric(question);
          if (rubric) {
            await Question.updateOne(
              { _id: question._id },
              { $set: { rubric } }
            );
            console.log(`Added rubric to question ${question._id}`);
          }
        } catch (error) {
          console.error(`Error processing question ${question._id}:`, error);
        }
      });

      await Promise.all(promises);

      // Add a delay between batches to avoid rate limits
      if (i + batchSize < questions.length) {
        console.log('Waiting 5 seconds before processing next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('Finished adding rubrics to questions');
  } catch (error) {
    console.error('Error adding rubrics to questions:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
connectToDatabase()
  .then(addRubricsToQuestions)
  .catch(error => {
    console.error('Script failed:', error);
    mongoose.disconnect();
    process.exit(1);
  });
