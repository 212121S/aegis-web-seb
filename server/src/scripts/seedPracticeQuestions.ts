import mongoose from 'mongoose';
import { Question } from '../models/Question';
import dotenv from 'dotenv';

dotenv.config();

const sampleQuestions = [
  {
    text: "In a DCF analysis for a healthcare company, how would you adjust the WACC to account for regulatory risks specific to the healthcare sector?",
    answer: "To adjust WACC for healthcare regulatory risks, you would: 1) Increase the beta component to reflect higher systematic risk from regulatory changes, 2) Add a company-specific risk premium to the cost of equity, 3) Consider the impact of regulations on the optimal capital structure, and 4) Potentially add a regulatory risk premium based on historical regulatory events in the sector.",
    explanation: "Healthcare companies face unique regulatory risks that affect their cost of capital. The adjustment process involves both quantitative and qualitative factors, ensuring the valuation reflects the higher uncertainty and compliance costs in the healthcare sector.",
    type: "open_ended",
    difficulty: 6,
    industryVerticals: ["Healthcare"],
    roles: ["Investment Banking", "Equity Research"],
    topics: ["DCF", "Comparable Company Analysis"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  {
    text: "When modeling synergies in a tech company merger, which of the following would NOT typically be considered a revenue synergy?",
    answer: "Consolidation of data centers",
    explanation: "Data center consolidation is a cost synergy, not a revenue synergy. Revenue synergies in tech M&A typically include cross-selling opportunities, platform integration benefits, and expanded market reach. Cost synergies include infrastructure consolidation, reduced overhead, and operational efficiencies.",
    type: "multiple_choice",
    options: [
      "Cross-selling of complementary products",
      "Enhanced platform monetization",
      "Consolidation of data centers",
      "Geographic market expansion"
    ],
    correctOption: "Consolidation of data centers",
    difficulty: 4,
    industryVerticals: ["TMT"],
    roles: ["Investment Banking", "M&A"],
    topics: ["M&A / Synergy Modeling"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  {
    text: "How would you adjust an LBO model for a software company transitioning from perpetual licenses to a SaaS model?",
    answer: "The key adjustments would include: 1) Modeling declining perpetual license revenue with growing subscription revenue, 2) Adjusting working capital for deferred revenue impacts, 3) Revising EBITDA margins to reflect higher initial costs but better long-term margins, 4) Modifying debt covenants to account for temporary cash flow impacts, and 5) Potentially extending the investment horizon to capture full benefits of the transition.",
    explanation: "This scenario requires understanding both software business models and LBO mechanics. The transition affects every aspect of the financial model, from revenue recognition to working capital and debt capacity. The model must balance short-term cash flow impacts with long-term value creation.",
    type: "open_ended",
    difficulty: 7,
    industryVerticals: ["TMT"],
    roles: ["Leveraged Finance", "Private Credit"],
    topics: ["LBO Modeling"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  {
    text: "Which financial metric would be MOST relevant when analyzing a distressed retail company's ability to restructure its debt?",
    answer: "Fixed charge coverage ratio",
    explanation: "The fixed charge coverage ratio is crucial in retail restructuring as it measures the company's ability to meet its fixed obligations, including rent (a major cost in retail). This ratio provides insight into operational sustainability and debt service capacity, key factors in restructuring negotiations.",
    type: "multiple_choice",
    options: [
      "Days inventory outstanding",
      "Fixed charge coverage ratio",
      "Gross margin percentage",
      "Same-store sales growth"
    ],
    correctOption: "Fixed charge coverage ratio",
    difficulty: 5,
    industryVerticals: ["Retail & Consumer"],
    roles: ["Restructuring"],
    topics: ["Restructuring / Distressed Analysis"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  {
    text: "How would you value a bank's loan portfolio in a potential M&A transaction?",
    answer: "To value a bank's loan portfolio: 1) Analyze historical loss rates and credit quality metrics, 2) Review loan concentrations by type and industry, 3) Assess current market interest rates vs. portfolio rates, 4) Consider economic cycle impacts on default probabilities, 5) Apply appropriate discount rates based on risk profiles, and 6) Factor in potential synergies from the acquirer's funding costs.",
    explanation: "Bank loan portfolio valuation requires understanding both credit risk and interest rate risk. The analysis must consider both quantitative factors (loss rates, interest rates) and qualitative factors (economic conditions, industry concentrations) to arrive at an appropriate valuation.",
    type: "open_ended",
    difficulty: 8,
    industryVerticals: ["FIG"],
    roles: ["Investment Banking", "M&A"],
    topics: ["DCF", "Credit Analysis"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing base questions
    await Question.deleteMany({ 'source.type': 'base' });
    console.log('Cleared existing base questions');

    // Insert new questions
    await Question.insertMany(sampleQuestions);
    console.log('Inserted sample questions');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
