import mongoose from 'mongoose';
import { Question } from '../models/Question';

const sampleQuestions = [
  {
    prompt: "What is the primary purpose of a balance sheet?",
    choices: [
      "To show company's revenue and expenses",
      "To show company's assets, liabilities, and equity at a point in time",
      "To show company's cash flows",
      "To show company's profit margins"
    ],
    correctAnswer: "To show company's assets, liabilities, and equity at a point in time",
    difficulty: 1,
    category: "Accounting",
    subcategory: "Financial Statements",
    isActive: true
  },
  {
    prompt: "Which financial metric is most commonly used to value early-stage companies?",
    choices: [
      "P/E Ratio",
      "Revenue Multiple",
      "Book Value",
      "Dividend Yield"
    ],
    correctAnswer: "Revenue Multiple",
    difficulty: 2,
    category: "Valuation",
    subcategory: "Multiples",
    isActive: true
  },
  {
    prompt: "What is the formula for calculating Free Cash Flow to Firm (FCFF)?",
    choices: [
      "Net Income + Depreciation - CapEx - Changes in Working Capital",
      "EBIT(1-t) + Depreciation - CapEx - Changes in Working Capital",
      "EBITDA - CapEx - Changes in Working Capital",
      "Operating Cash Flow - CapEx"
    ],
    correctAnswer: "EBIT(1-t) + Depreciation - CapEx - Changes in Working Capital",
    difficulty: 3,
    category: "Financial Modeling",
    subcategory: "Cash Flow Analysis",
    isActive: true
  },
  {
    prompt: "In a DCF model, what does the terminal value represent?",
    choices: [
      "The value of the company's assets",
      "The present value of all future cash flows beyond the forecast period",
      "The company's current market value",
      "The value of the company's debt"
    ],
    correctAnswer: "The present value of all future cash flows beyond the forecast period",
    difficulty: 4,
    category: "Valuation",
    subcategory: "DCF Analysis",
    isActive: true
  },
  {
    prompt: "What is the difference between operating and financial leverage?",
    choices: [
      "Operating leverage relates to fixed costs, financial leverage to debt",
      "Operating leverage relates to variable costs, financial leverage to equity",
      "Operating leverage relates to debt, financial leverage to fixed costs",
      "Operating leverage relates to equity, financial leverage to variable costs"
    ],
    correctAnswer: "Operating leverage relates to fixed costs, financial leverage to debt",
    difficulty: 5,
    category: "Financial Modeling",
    subcategory: "Leverage Analysis",
    isActive: true
  }
];

async function addSampleQuestions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aegis');
    console.log('Connected to MongoDB');

    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Add new questions
    const result = await Question.insertMany(sampleQuestions);
    console.log(`Added ${result.length} sample questions`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

addSampleQuestions();
