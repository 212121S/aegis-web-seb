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
    return generateDefaultRubric();
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
          2. Provide a clear description of what constitutes addressing each concept
          3. Assign weights to each concept based on importance (weights should sum to 100)
          4. Cover different aspects of a complete answer (e.g., theory, application, analysis)
          
          Return your response as a JSON object with the following structure:
          {
            "criteria": [
              {
                "concept": "Key concept name",
                "description": "Brief description of what should be mentioned",
                "weight": 25
              },
              ...
            ]
          }`
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
      return generateDefaultRubric();
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
      return generateDefaultRubric();
    }

    return rubric;
  } catch (error) {
    console.error('Error generating rubric:', error);
    return generateDefaultRubric();
  }
};

// Generate a default rubric if OpenAI fails
const generateDefaultRubric = (): {
  criteria: Array<{
    concept: string;
    description: string;
    weight: number;
  }>;
} => {
  return {
    criteria: [
      {
        concept: "Technical Accuracy",
        description: "Correct application of financial concepts and terminology",
        weight: 40
      },
      {
        concept: "Completeness",
        description: "Coverage of all key aspects of the question",
        weight: 30
      },
      {
        concept: "Strategic Thinking",
        description: "Consideration of implications and multiple scenarios",
        weight: 20
      },
      {
        concept: "Practical Implementation",
        description: "Addressing real-world constraints and challenges",
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
