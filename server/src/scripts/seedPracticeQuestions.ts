import mongoose from 'mongoose';
import { Question } from '../models/Question';
import dotenv from 'dotenv';

dotenv.config();

// Enhanced level 8 questions for top percentile differentiation
const enhancedLevel8Questions = [
  {
    text: "A major pharmaceutical company is considering acquiring a digital health startup that has developed an AI-powered drug discovery platform. The startup has no revenue but has several pending patents and a significant R&D pipeline. How would you structure the valuation and deal terms to address the unique risks and opportunities?",
    answer: "A comprehensive valuation and deal structure should include:\n\n1. Technology Valuation:\n- Assess the AI platform's capabilities and competitive advantage\n- Value the proprietary algorithms and data assets\n- Benchmark against comparable AI/ML platforms\n\n2. IP Portfolio Analysis:\n- Value pending patents using probability-adjusted DCF\n- Assess patent strength and potential challenges\n- Model licensing potential and royalty streams\n\n3. R&D Pipeline Valuation:\n- Apply rNPV (risk-adjusted Net Present Value) methodology\n- Model phase-specific success probabilities\n- Include cost and timeline estimates for each candidate\n\n4. Deal Structure:\n- Upfront payment based on platform value and validated IP\n- Milestone payments tied to:\n  * Patent approvals\n  * Platform performance metrics\n  * Drug candidate progression\n- Royalty structure on successfully commercialized drugs\n\n5. Risk Mitigation:\n- Technology escrow arrangements\n- Key employee retention packages\n- Data rights and ownership provisions\n- Regulatory compliance requirements\n\n6. Strategic Considerations:\n- Integration planning for the AI platform\n- Data privacy and security measures\n- Talent retention strategy\n- Competition analysis",
    explanation: "This question tests multiple domains: tech valuation, biotech IP assessment, and M&A structuring. The candidate must demonstrate understanding of both traditional valuation methods and their adaptation for emerging technologies, while also considering practical implementation challenges.",
    type: "open_ended",
    difficulty: 8,
    industryVerticals: ["Healthcare", "TMT"],
    roles: ["M&A", "Investment Banking"],
    topics: ["Valuation", "M&A / Synergy Modeling", "IP Valuation"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  {
    text: "You're advising a European manufacturing client considering a leveraged acquisition of a U.S. competitor during a period of rising interest rates, high inflation, and increasing trade tensions. The target has significant exposure to Chinese suppliers and U.S. government contracts. How would you adjust the traditional LBO framework to account for these factors?",
    answer: "The adjusted LBO framework should address:\n\n1. Financing Structure:\n- Interest rate hedging strategy\n- Multi-currency debt tranches\n- Flexible covenants for macro volatility\n- Working capital facility sizing\n\n2. Operating Model Adjustments:\n- Inflation pass-through analysis\n- Supply chain restructuring costs\n- Labor cost escalators\n- Capacity utilization scenarios\n\n3. Risk Mitigation:\n- FX hedging strategy\n- Supplier diversification costs\n- Government contract novation process\n- Trade compliance requirements\n\n4. Capital Structure:\n- Stress testing under various scenarios\n- Covenant headroom analysis\n- Alternative financing sources\n- Deleveraging timeline adjustments\n\n5. Exit Considerations:\n- Multiple compression analysis\n- Geographic diversification value\n- Strategic buyer universe\n- IPO market timing\n\n6. Implementation Plan:\n- Supply chain transition timeline\n- Regulatory approval strategy\n- Integration milestones\n- Stakeholder communication plan",
    explanation: "This question requires synthesizing multiple risk factors and their interconnected impacts on an LBO structure. The candidate must demonstrate understanding of both technical financial modeling and practical business considerations in a complex macro environment.",
    type: "open_ended",
    difficulty: 8,
    industryVerticals: ["Industrials"],
    roles: ["Leveraged Finance", "Private Equity"],
    topics: ["LBO Modeling", "Risk Management"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  {
    text: "Structure a cross-border carve-out of a division with shared IP, intercompany services, and complex transfer pricing arrangements. The parent is a Japanese conglomerate, and the buyer is a U.S. PE firm planning to merge it with a German portfolio company.",
    answer: "The carve-out structure should address:\n\n1. Transaction Structure:\n- Legal entity organization\n- Tax-efficient holding structure\n- IP holding company location\n- Intercompany agreement framework\n\n2. Operational Separation:\n- TSA scope and pricing\n- Shared service migration plan\n- IT system separation\n- Employee transfer mechanism\n\n3. IP Strategy:\n- Patent and trademark allocation\n- Cross-licensing agreements\n- R&D continuation rights\n- Data ownership and access\n\n4. Tax Considerations:\n- Transfer pricing documentation\n- Exit tax liability analysis\n- Step-up opportunities\n- Withholding tax planning\n\n5. Integration Planning:\n- Day 1 readiness assessment\n- Synergy implementation plan\n- Cultural integration strategy\n- Management structure\n\n6. Regulatory Strategy:\n- Multi-jurisdiction filing strategy\n- CFIUS considerations\n- Labor law compliance\n- Competition clearance approach",
    explanation: "This question tests the ability to handle complex cross-border implementation challenges. The candidate must demonstrate understanding of technical, operational, and cultural aspects of a sophisticated carve-out transaction.",
    type: "open_ended",
    difficulty: 8,
    industryVerticals: ["Cross-Industry"],
    roles: ["M&A", "Private Equity"],
    topics: ["M&A / Synergy Modeling", "Transaction Structuring"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  }
];

// Original sample questions
const baseQuestions = [
  {
    text: "Which accounting method is typically used to record revenue from long-term healthcare service contracts?",
    answer: "Percentage of completion method",
    explanation: "The percentage of completion method is most appropriate for long-term healthcare service contracts as it better reflects the economic reality of service delivery over time. This method recognizes revenue and profit as service milestones are achieved, providing a more accurate picture of the company's financial performance.",
    type: "multiple_choice",
    options: [
      "Cash basis",
      "Completed contract method",
      "Percentage of completion method",
      "Installment method"
    ],
    correctOption: "Percentage of completion method",
    difficulty: 4,
    industryVerticals: ["Healthcare"],
    roles: ["Investment Banking"],
    topics: ["Accounting"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  {
    text: "In healthcare M&A valuation, which accounting adjustment is most critical when normalizing EBITDA?",
    answer: "Provider compensation adjustments",
    explanation: "Provider compensation adjustments are crucial in healthcare valuations as physician/provider compensation can vary significantly from market rates. This adjustment ensures comparable analysis across different healthcare organizations and reflects true operational performance.",
    type: "multiple_choice",
    options: [
      "Depreciation methods",
      "Provider compensation adjustments",
      "Inventory valuation",
      "Research and development costs"
    ],
    correctOption: "Provider compensation adjustments",
    difficulty: 5,
    industryVerticals: ["Healthcare"],
    roles: ["Investment Banking"],
    topics: ["Accounting"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  {
    text: "How should a healthcare company account for medical malpractice insurance in its financial statements?",
    answer: "As a contingent liability with regular premium expenses",
    explanation: "Medical malpractice insurance should be recorded as a contingent liability with regular premium expenses. This approach properly reflects both the ongoing cost of coverage and potential future claims, following accounting principles for risk management in healthcare organizations.",
    type: "multiple_choice",
    options: [
      "As a prepaid asset",
      "As an operating expense only",
      "As a contingent liability with regular premium expenses",
      "As a capital expenditure"
    ],
    correctOption: "As a contingent liability with regular premium expenses",
    difficulty: 3,
    industryVerticals: ["Healthcare"],
    roles: ["Investment Banking"],
    topics: ["Accounting"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
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

// Combine enhanced and base questions
const sampleQuestions = [...enhancedLevel8Questions, ...baseQuestions];

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
