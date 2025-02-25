import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { config } from 'dotenv';

// Load environment variables
config();

// Sample questions to ensure there are always valid questions in the database
const sampleQuestions = [
  // Multiple choice questions
  {
    text: "What is the primary purpose of a Discounted Cash Flow (DCF) analysis?",
    answer: "To determine the present value of expected future cash flows",
    explanation: "DCF analysis is a valuation method used to estimate the value of an investment based on its expected future cash flows. By discounting the future cash flows back to the present value, investors can determine whether the investment is worthwhile based on their required rate of return.",
    type: "multiple_choice",
    options: [
      "To determine the present value of expected future cash flows",
      "To calculate the book value of a company",
      "To estimate the liquidation value of assets",
      "To determine the market capitalization of a company"
    ],
    correctOption: "To determine the present value of expected future cash flows",
    difficulty: 3,
    industryVerticals: ["Healthcare", "FIG", "TMT", "Energy", "Retail & Consumer", "Industrials"],
    roles: ["Investment Banking", "Equity Research", "M&A"],
    topics: ["DCF"],
    source: {
      type: "base",
      timestamp: new Date()
    }
  },
  {
    text: "In a Leveraged Buyout (LBO) model, which of the following is typically the primary source of returns?",
    answer: "Debt paydown and multiple expansion",
    explanation: "In an LBO, returns are typically generated through a combination of operational improvements, debt paydown, and multiple expansion. However, debt paydown and multiple expansion are often the primary drivers of returns, as the financial sponsor uses significant leverage to amplify equity returns and aims to sell the company at a higher multiple than the purchase multiple.",
    type: "multiple_choice",
    options: [
      "Dividend recapitalization",
      "Debt paydown and multiple expansion",
      "Revenue growth alone",
      "Tax shield benefits"
    ],
    correctOption: "Debt paydown and multiple expansion",
    difficulty: 5,
    industryVerticals: ["Healthcare", "FIG", "TMT", "Energy", "Retail & Consumer", "Industrials"],
    roles: ["Investment Banking", "Private Credit", "Leveraged Finance"],
    topics: ["LBO Modeling"],
    source: {
      type: "base",
      timestamp: new Date()
    }
  },
  {
    text: "Which financial metric is most appropriate for valuing a company with negative earnings but positive EBITDA?",
    answer: "EV/EBITDA",
    explanation: "EV/EBITDA is often used for companies with negative earnings but positive EBITDA because it allows for comparison of companies with different capital structures and tax situations. Unlike P/E ratios, which cannot be calculated for companies with negative earnings, EV/EBITDA can still provide a meaningful valuation metric when a company has positive EBITDA despite negative net income.",
    type: "multiple_choice",
    options: [
      "P/E ratio",
      "EV/EBITDA",
      "P/Book Value",
      "Dividend Yield"
    ],
    correctOption: "EV/EBITDA",
    difficulty: 4,
    industryVerticals: ["Healthcare", "TMT", "Retail & Consumer", "Industrials"],
    roles: ["Investment Banking", "Equity Research"],
    topics: ["Comparable Company Analysis"],
    source: {
      type: "base",
      timestamp: new Date()
    }
  },
  {
    text: "What is the primary difference between a strategic buyer and a financial buyer in M&A transactions?",
    answer: "Strategic buyers seek synergies while financial buyers focus on financial returns",
    explanation: "Strategic buyers are typically operating companies in the same or related industries that acquire companies to realize synergies, expand market share, or enhance capabilities. Financial buyers, such as private equity firms, primarily seek financial returns through operational improvements, financial engineering, and eventual exit at a higher valuation multiple.",
    type: "multiple_choice",
    options: [
      "Strategic buyers use only stock while financial buyers use only cash",
      "Strategic buyers seek synergies while financial buyers focus on financial returns",
      "Strategic buyers are always larger than the target while financial buyers are smaller",
      "Strategic buyers hold investments indefinitely while financial buyers always sell within one year"
    ],
    correctOption: "Strategic buyers seek synergies while financial buyers focus on financial returns",
    difficulty: 3,
    industryVerticals: ["Healthcare", "FIG", "TMT", "Energy", "Retail & Consumer", "Industrials"],
    roles: ["Investment Banking", "M&A"],
    topics: ["M&A / Synergy Modeling"],
    source: {
      type: "base",
      timestamp: new Date()
    }
  },
  {
    text: "In credit analysis, which of the following ratios is most useful for assessing a company's ability to meet its short-term obligations?",
    answer: "Current Ratio",
    explanation: "The Current Ratio (Current Assets / Current Liabilities) is a liquidity ratio that measures a company's ability to pay short-term obligations within one year. A ratio above 1 indicates that the company has more current assets than current liabilities, suggesting it can cover its short-term obligations. This makes it particularly useful for assessing short-term liquidity risk.",
    type: "multiple_choice",
    options: [
      "Debt-to-EBITDA",
      "Current Ratio",
      "Return on Assets",
      "Dividend Payout Ratio"
    ],
    correctOption: "Current Ratio",
    difficulty: 2,
    industryVerticals: ["Healthcare", "FIG", "TMT", "Energy", "Retail & Consumer", "Industrials"],
    roles: ["Leveraged Finance", "Private Credit"],
    topics: ["Credit Analysis", "Accounting"],
    source: {
      type: "base",
      timestamp: new Date()
    }
  },
  
  // Open-ended questions
  {
    text: "Explain the concept of WACC (Weighted Average Cost of Capital) and how it is calculated. Why is it important in valuation?",
    answer: "WACC is the average rate of return a company must pay to its investors for using their capital. It's calculated as a weighted average of the cost of equity and the after-tax cost of debt, with weights based on the company's target capital structure. WACC is crucial in valuation as it serves as the discount rate in DCF models, reflecting the riskiness of the company's cash flows and the opportunity cost of capital.",
    explanation: "WACC represents the minimum return that a company must earn on its existing assets to satisfy its creditors, owners, and other capital providers. It's calculated using the formula: WACC = (E/V × Re) + (D/V × Rd × (1-T)), where E is equity value, D is debt value, V is total value (E+D), Re is cost of equity, Rd is cost of debt, and T is the tax rate. WACC is essential in valuation because it accounts for the time value of money and risk in discounting future cash flows to present value.",
    type: "open_ended",
    difficulty: 4,
    industryVerticals: ["Healthcare", "FIG", "TMT", "Energy", "Retail & Consumer", "Industrials"],
    roles: ["Investment Banking", "Equity Research"],
    topics: ["DCF"],
    source: {
      type: "base",
      timestamp: new Date()
    },
    rubric: {
      criteria: [
        {
          concept: "Definition and Components",
          description: "Accurately defines WACC and identifies its key components (cost of equity, cost of debt, capital structure weights)",
          weight: 25
        },
        {
          concept: "Calculation Methodology",
          description: "Correctly explains the WACC formula and how each component is determined",
          weight: 25
        },
        {
          concept: "Application in Valuation",
          description: "Explains how WACC is used as a discount rate in DCF models and its significance in determining present value",
          weight: 25
        },
        {
          concept: "Conceptual Understanding",
          description: "Demonstrates understanding of WACC as representing opportunity cost of capital and risk premium",
          weight: 25
        }
      ]
    }
  },
  {
    text: "Describe the key steps in conducting a comparable company analysis. What are the potential pitfalls and how would you address them?",
    answer: "Comparable company analysis involves selecting a relevant peer group, gathering financial data, calculating valuation multiples, and applying these multiples to the target company. Key steps include: 1) Identifying truly comparable companies based on industry, size, growth, and risk profile; 2) Collecting and normalizing financial data; 3) Calculating appropriate multiples (EV/EBITDA, P/E, etc.); 4) Adjusting for outliers and company-specific factors; and 5) Applying the multiples to derive a valuation range. Potential pitfalls include selecting inappropriate peers, using non-normalized financials, ignoring growth differences, and applying multiples mechanically without considering company-specific factors. These can be addressed through rigorous peer selection, careful financial adjustments, and supplementing the analysis with other valuation methods.",
    explanation: "Comparable company analysis is a relative valuation method that values a company based on how similar companies are priced in the market. The quality of the analysis depends heavily on selecting truly comparable companies and making appropriate adjustments to account for differences. Common pitfalls include selecting peers with different growth profiles, risk characteristics, or capital structures, which can lead to misleading valuation conclusions. A robust analysis should consider these differences and potentially apply discounts or premiums to the derived multiples.",
    type: "open_ended",
    difficulty: 5,
    industryVerticals: ["Healthcare", "FIG", "TMT", "Energy", "Retail & Consumer", "Industrials"],
    roles: ["Investment Banking", "Equity Research"],
    topics: ["Comparable Company Analysis"],
    source: {
      type: "base",
      timestamp: new Date()
    },
    rubric: {
      criteria: [
        {
          concept: "Process Description",
          description: "Clearly outlines the key steps in conducting a comparable company analysis in a logical sequence",
          weight: 30
        },
        {
          concept: "Peer Selection Criteria",
          description: "Identifies appropriate criteria for selecting comparable companies and explains their importance",
          weight: 20
        },
        {
          concept: "Multiple Selection and Calculation",
          description: "Discusses relevant valuation multiples and how they should be calculated and interpreted",
          weight: 20
        },
        {
          concept: "Pitfall Identification and Mitigation",
          description: "Identifies potential pitfalls in the analysis and proposes specific solutions to address them",
          weight: 30
        }
      ]
    }
  },
  {
    text: "Analyze the key considerations in structuring a leveraged buyout (LBO) transaction. How do these considerations impact the potential returns for the financial sponsor?",
    answer: "Key considerations in structuring an LBO include: 1) Purchase price and entry multiple; 2) Capital structure and leverage levels; 3) Financing terms (interest rates, covenants, maturities); 4) Operational improvement opportunities; 5) Exit strategy and timeline; and 6) Management alignment. The purchase price directly impacts returns - a lower entry multiple increases potential returns. Higher leverage amplifies equity returns but increases risk of financial distress. Favorable debt terms (lower rates, covenant-lite) improve cash flow available for debt repayment. Operational improvements drive EBITDA growth, enhancing both ongoing cash flow and exit valuation. A well-planned exit strategy (typically in 3-7 years) at a higher multiple than entry creates additional value. Finally, aligning management incentives with the sponsor's goals ensures focus on value creation initiatives that drive returns.",
    explanation: "LBO structuring involves balancing risk and return through financial engineering and operational improvements. The financial sponsor's returns are primarily driven by multiple expansion, debt paydown, and EBITDA growth. The initial purchase price sets the baseline for returns, while the capital structure determines the risk profile and potential equity upside. Operational improvements are crucial for generating the cash flow needed to service debt and create value. The exit strategy, typically through a strategic sale or IPO, ultimately realizes the value created during the holding period.",
    type: "open_ended",
    difficulty: 6,
    industryVerticals: ["Healthcare", "TMT", "Retail & Consumer", "Industrials"],
    roles: ["Investment Banking", "Private Credit", "Leveraged Finance"],
    topics: ["LBO Modeling"],
    source: {
      type: "base",
      timestamp: new Date()
    },
    rubric: {
      criteria: [
        {
          concept: "Transaction Structure Elements",
          description: "Identifies and explains the key components of LBO transaction structure including purchase price, capital structure, and financing terms",
          weight: 25
        },
        {
          concept: "Leverage Impact Analysis",
          description: "Analyzes how different leverage levels and debt terms affect risk profile and potential equity returns",
          weight: 25
        },
        {
          concept: "Operational Value Creation",
          description: "Discusses operational improvement strategies and their impact on cash flow generation and exit valuation",
          weight: 25
        },
        {
          concept: "Exit Strategy Considerations",
          description: "Evaluates different exit options and timing considerations and how they affect overall investment returns",
          weight: 25
        }
      ]
    }
  },
  {
    text: "Explain the concept of synergies in M&A transactions. How would you categorize different types of synergies, and what approaches would you use to value them?",
    answer: "Synergies in M&A represent the additional value created when two companies combine that wouldn't be possible if they remained separate. They can be categorized as revenue synergies (cross-selling, pricing power, new market access), cost synergies (operational efficiencies, redundancy elimination, economies of scale), financial synergies (tax benefits, lower cost of capital, improved debt capacity), and strategic synergies (intellectual property, talent acquisition, competitive positioning). To value synergies, I would use several approaches: 1) Bottom-up analysis - identifying specific synergy opportunities and quantifying each one; 2) DCF analysis - projecting incremental cash flows from synergies and discounting them at an appropriate rate; 3) Multiple-based approach - estimating the impact on key metrics (EBITDA, revenue) and applying relevant multiples; and 4) Real options analysis for strategic synergies with uncertain outcomes. The valuation should account for implementation costs, timing, and probability of achievement, with cost synergies typically receiving higher probability weights than revenue synergies due to their greater certainty.",
    explanation: "Synergies are a critical component of M&A value creation and often justify the acquisition premium paid by acquirers. However, they are frequently overestimated, with studies showing that many M&A transactions fail to deliver the expected synergies. A rigorous approach to synergy valuation involves detailed analysis of specific opportunities, realistic implementation timelines, and appropriate risk-adjustment based on the type of synergy. Cost synergies are generally more reliable and faster to realize than revenue synergies, which depend on customer behavior and market dynamics. The valuation should also consider integration costs and potential dis-synergies from cultural clashes or business disruption.",
    type: "open_ended",
    difficulty: 5,
    industryVerticals: ["Healthcare", "FIG", "TMT", "Energy", "Retail & Consumer", "Industrials"],
    roles: ["Investment Banking", "M&A"],
    topics: ["M&A / Synergy Modeling"],
    source: {
      type: "base",
      timestamp: new Date()
    },
    rubric: {
      criteria: [
        {
          concept: "Synergy Definition and Types",
          description: "Clearly defines synergies and comprehensively categorizes different types with relevant examples",
          weight: 25
        },
        {
          concept: "Valuation Methodologies",
          description: "Explains multiple approaches to valuing synergies with appropriate application contexts",
          weight: 30
        },
        {
          concept: "Risk and Probability Assessment",
          description: "Discusses how to assess the likelihood of achieving different synergies and incorporating risk into valuation",
          weight: 25
        },
        {
          concept: "Implementation Considerations",
          description: "Addresses implementation costs, timeline considerations, and potential challenges in realizing synergies",
          weight: 20
        }
      ]
    }
  },
  {
    text: "Discuss the key financial metrics and ratios used in credit analysis. How do these metrics help assess a company's creditworthiness, and what are their limitations?",
    answer: "Credit analysis relies on several key financial metrics to assess a company's ability to meet debt obligations. Leverage ratios like Debt/EBITDA and Debt/Capital measure indebtedness relative to earnings or total capital. Coverage ratios such as Interest Coverage (EBIT/Interest) and Fixed Charge Coverage evaluate the ability to service debt from operating earnings. Liquidity ratios including Current Ratio and Quick Ratio assess short-term payment ability. Profitability metrics like EBITDA Margin and Return on Assets indicate earnings quality and operational efficiency. Cash flow measures such as Free Cash Flow and Cash Flow from Operations to Debt show debt repayment capacity from internally generated funds. These metrics help assess creditworthiness by evaluating capital structure, debt service capacity, liquidity, profitability, and cash generation. However, they have limitations: they're backward-looking, can be manipulated through accounting choices, don't capture off-balance sheet obligations, may miss industry-specific factors, and don't account for qualitative factors like management quality or competitive position. A comprehensive analysis should combine these metrics with industry benchmarking, trend analysis, stress testing, and qualitative assessment of business fundamentals.",
    explanation: "Credit analysis focuses on assessing default risk and recovery prospects in case of default. Financial metrics provide quantitative tools to evaluate a company's financial health and debt capacity, but they must be interpreted in context. Industry norms vary significantly - what constitutes acceptable leverage in a stable utility company would be concerning in a cyclical industry. Additionally, GAAP or IFRS accounting may not fully capture economic reality, requiring adjustments for items like operating leases, pension obligations, or non-recurring items. Trend analysis is often more valuable than point-in-time metrics, as deteriorating ratios may signal increasing risk even if absolute levels appear acceptable. Sophisticated credit analysis also incorporates scenario analysis to assess how metrics might evolve under different economic conditions.",
    type: "open_ended",
    difficulty: 5,
    industryVerticals: ["Healthcare", "FIG", "TMT", "Energy", "Retail & Consumer", "Industrials"],
    roles: ["Leveraged Finance", "Private Credit"],
    topics: ["Credit Analysis"],
    source: {
      type: "base",
      timestamp: new Date()
    },
    rubric: {
      criteria: [
        {
          concept: "Key Metrics Identification",
          description: "Comprehensively identifies and explains the primary financial metrics used in credit analysis across different categories",
          weight: 25
        },
        {
          concept: "Analytical Application",
          description: "Demonstrates how these metrics are applied to assess different aspects of creditworthiness and debt capacity",
          weight: 25
        },
        {
          concept: "Limitations Analysis",
          description: "Critically evaluates the limitations and potential pitfalls of relying on financial metrics alone",
          weight: 25
        },
        {
          concept: "Comprehensive Framework",
          description: "Presents a holistic approach to credit analysis that combines quantitative metrics with qualitative factors and contextual considerations",
          weight: 25
        }
      ]
    }
  }
];

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Add sample questions to the database
const addSampleQuestions = async () => {
  try {
    await connectToDatabase();

    // Check if questions already exist
    const existingCount = await Question.countDocuments({ 'source.type': 'base' });
    console.log(`Found ${existingCount} existing base questions`);

    if (existingCount >= sampleQuestions.length) {
      console.log('Sample questions already exist in the database. Skipping insertion.');
      return;
    }

    // Insert sample questions
    const result = await Question.insertMany(sampleQuestions);
    console.log(`Successfully added ${result.length} sample questions to the database`);
  } catch (error) {
    console.error('Error adding sample questions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
addSampleQuestions();
