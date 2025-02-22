import mongoose from 'mongoose';
import { Question } from '../models/Question';

const sampleQuestions = [
  {
    text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
    type: 'practice'
  },
  {
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 'Mars',
    type: 'practice'
  },
  {
    text: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    type: 'practice'
  },
  {
    text: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correctAnswer: 'William Shakespeare',
    type: 'practice'
  },
  {
    text: 'What is the chemical symbol for gold?',
    options: ['Ag', 'Fe', 'Au', 'Cu'],
    correctAnswer: 'Au',
    type: 'practice'
  },
  {
    text: 'Which is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 'Pacific Ocean',
    type: 'practice'
  },
  {
    text: 'What is the square root of 16?',
    options: ['2', '3', '4', '5'],
    correctAnswer: '4',
    type: 'practice'
  },
  {
    text: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
    correctAnswer: 'Leonardo da Vinci',
    type: 'practice'
  },
  {
    text: 'What is the largest planet in our solar system?',
    options: ['Mars', 'Saturn', 'Jupiter', 'Neptune'],
    correctAnswer: 'Jupiter',
    type: 'practice'
  },
  {
    text: 'Which element has the chemical symbol "O"?',
    options: ['Gold', 'Oxygen', 'Iron', 'Silver'],
    correctAnswer: 'Oxygen',
    type: 'practice'
  }
];

const populateQuestions = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing questions
    await Question.deleteMany({ type: 'practice' });
    console.log('Cleared existing practice questions');

    // Insert sample questions
    await Question.insertMany(sampleQuestions);
    console.log('Inserted sample questions');

    console.log('Database populated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error populating database:', error);
    process.exit(1);
  }
};

populateQuestions();
