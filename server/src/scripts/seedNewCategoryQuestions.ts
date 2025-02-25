import mongoose from 'mongoose';
import { Question } from '../models/Question';
import dotenv from 'dotenv';

dotenv.config();

// Sample questions for new categories
const newCategoryQuestions = [
  // New Industry Verticals
  
  // Agriculture & Food
  {
    text: "What valuation multiple is most commonly used for food processing companies with significant brand value?",
    answer: "EV/EBITDA",
    explanation: "EV/EBITDA is the most commonly used valuation multiple for food processing companies with significant brand value. This multiple accounts for the capital-intensive nature of food processing while capturing the value of strong brands that generate consistent EBITDA margins. Food companies with premium brands typically trade at higher EV/EBITDA multiples than commodity food processors.",
    type: "multiple_choice",
    options: [
      "P/E",
      "EV/EBITDA",
      "P/Book Value",
      "EV/Revenue"
    ],
    correctOption: "EV/EBITDA",
    difficulty: 3,
    industryVerticals: ["Agriculture & Food"],
    roles: ["Investment Banking", "Equity Research"],
    topics: ["Valuation", "Comparable Company Analysis"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Aerospace & Defense
  {
    text: "In valuing defense contractors, which of the following metrics is most important due to the nature of government contracts?",
    answer: "Backlog and contract visibility",
    explanation: "Backlog and contract visibility are crucial metrics when valuing defense contractors because they provide insight into future revenue streams. Defense companies typically operate under long-term government contracts, making their future cash flows more predictable than in many other industries. A strong backlog indicates secured future revenues, reducing uncertainty in valuation models.",
    type: "multiple_choice",
    options: [
      "Quarterly revenue growth",
      "Backlog and contract visibility",
      "Dividend yield",
      "Same-store sales"
    ],
    correctOption: "Backlog and contract visibility",
    difficulty: 4,
    industryVerticals: ["Aerospace & Defense"],
    roles: ["Investment Banking", "Equity Research"],
    topics: ["Valuation", "Industry-Specific Metrics"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Chemicals
  {
    text: "When analyzing a specialty chemicals company, which cyclical indicator would be most relevant to include in your valuation model?",
    answer: "Industrial production index",
    explanation: "The industrial production index is the most relevant cyclical indicator for specialty chemicals companies because their products are primarily used as inputs in manufacturing processes. Changes in industrial production directly impact demand for specialty chemicals, making this index a leading indicator for revenue forecasting and cyclical adjustments in valuation models.",
    type: "multiple_choice",
    options: [
      "Consumer confidence index",
      "Housing starts",
      "Industrial production index",
      "Retail sales"
    ],
    correctOption: "Industrial production index",
    difficulty: 4,
    industryVerticals: ["Chemicals"],
    roles: ["Equity Research", "Investment Banking"],
    topics: ["Valuation", "Industry-Specific Metrics"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Fintech
  {
    text: "What metric is most critical when valuing a payment processing fintech company?",
    answer: "Total payment volume (TPV) growth",
    explanation: "Total payment volume (TPV) growth is the most critical metric for payment processing fintech companies as it directly correlates with revenue potential. TPV represents the total value of transactions processed, and companies typically earn a percentage fee on this volume. Strong TPV growth indicates market share gains and is a leading indicator of future revenue growth, making it central to valuation models in this sector.",
    type: "multiple_choice",
    options: [
      "Net interest margin",
      "Total payment volume (TPV) growth",
      "Loan loss provisions",
      "Branch efficiency ratio"
    ],
    correctOption: "Total payment volume (TPV) growth",
    difficulty: 4,
    industryVerticals: ["Fintech", "FIG"],
    roles: ["Investment Banking", "Equity Research", "Venture Capital"],
    topics: ["Valuation", "Industry-Specific Metrics"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Pharmaceuticals
  {
    text: "In pharmaceutical company valuation, how should the risk of clinical trial failure be incorporated into a DCF model?",
    answer: "Using probability-adjusted NPV (rNPV) for each drug in the pipeline",
    explanation: "Pharmaceutical company valuation requires accounting for the significant risk of clinical trial failures. The probability-adjusted NPV (rNPV) methodology applies phase-specific success probabilities to each drug candidate's projected cash flows. This approach weights the potential returns by the statistical likelihood of success at each development stage, providing a more realistic valuation than standard DCF models that don't account for the binary nature of drug development outcomes.",
    type: "multiple_choice",
    options: [
      "Using a higher discount rate for the entire company",
      "Excluding pipeline drugs entirely from the valuation",
      "Using probability-adjusted NPV (rNPV) for each drug in the pipeline",
      "Applying a standard industry multiple to current revenues"
    ],
    correctOption: "Using probability-adjusted NPV (rNPV) for each drug in the pipeline",
    difficulty: 5,
    industryVerticals: ["Pharmaceuticals", "Healthcare"],
    roles: ["Equity Research", "Investment Banking"],
    topics: ["Valuation", "DCF", "Risk Management"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Renewable Energy
  {
    text: "What is the most appropriate valuation methodology for early-stage renewable energy projects?",
    answer: "Levelized Cost of Energy (LCOE) comparison",
    explanation: "The Levelized Cost of Energy (LCOE) comparison is the most appropriate valuation methodology for early-stage renewable energy projects. LCOE calculates the present value of the total cost of building and operating a power plant over its lifetime divided by the total energy output, providing a per-unit cost of electricity. This allows for direct comparison between different energy technologies and projects, accounting for their varying capital costs, operating costs, capacity factors, and lifespans.",
    type: "multiple_choice",
    options: [
      "EV/EBITDA multiple",
      "Dividend discount model",
      "Levelized Cost of Energy (LCOE) comparison",
      "Price-to-book ratio"
    ],
    correctOption: "Levelized Cost of Energy (LCOE) comparison",
    difficulty: 5,
    industryVerticals: ["Renewable Energy", "Energy"],
    roles: ["Investment Banking", "Project Finance"],
    topics: ["Valuation", "Project Finance"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // New Roles
  
  // Private Equity
  {
    text: "In a private equity LBO model, which of the following would have the greatest positive impact on IRR?",
    answer: "Lower entry multiple",
    explanation: "A lower entry multiple has the greatest positive impact on IRR in a private equity LBO model. The entry multiple directly affects the initial equity investment required, and a lower multiple means paying less for the same EBITDA. This creates more potential for multiple expansion upon exit and reduces the amount of debt needed, both of which significantly enhance equity returns. While operational improvements and higher leverage also impact returns, the entry valuation typically has the most direct and substantial effect on IRR.",
    type: "multiple_choice",
    options: [
      "Higher leverage",
      "Lower entry multiple",
      "Longer holding period",
      "Higher exit multiple"
    ],
    correctOption: "Lower entry multiple",
    difficulty: 4,
    industryVerticals: ["Cross-Industry"],
    roles: ["Private Equity", "Investment Banking"],
    topics: ["LBO Modeling", "Private Equity"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Risk Management
  {
    text: "Which risk management technique would be most appropriate for a company concerned about foreign exchange exposure from operations in multiple countries?",
    answer: "Currency swaps",
    explanation: "Currency swaps are the most appropriate risk management technique for a company with operations in multiple countries concerned about foreign exchange exposure. Unlike forward contracts which are typically short-term, currency swaps allow companies to exchange principal and interest payments in different currencies over longer periods, matching the ongoing nature of multinational operations. This provides a comprehensive hedge against both transaction and translation FX risks while potentially lowering borrowing costs in foreign currencies.",
    type: "multiple_choice",
    options: [
      "Interest rate caps",
      "Credit default swaps",
      "Currency swaps",
      "Commodity futures"
    ],
    correctOption: "Currency swaps",
    difficulty: 5,
    industryVerticals: ["Cross-Industry"],
    roles: ["Risk Management", "Treasury"],
    topics: ["Risk Management", "Derivatives & Structured Products"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Sales & Trading
  {
    text: "What trading strategy would be most effective for capturing the spread between convertible bonds and their underlying equities?",
    answer: "Convertible arbitrage",
    explanation: "Convertible arbitrage is the most effective strategy for capturing the spread between convertible bonds and their underlying equities. This strategy typically involves taking a long position in a convertible bond while simultaneously shorting the underlying equity. The approach aims to exploit pricing inefficiencies between the convertible security and the stock, while remaining relatively market-neutral. Traders profit from the yield of the convertible bond and the volatility of the underlying equity, while hedging against directional market movements.",
    type: "multiple_choice",
    options: [
      "Merger arbitrage",
      "Convertible arbitrage",
      "Statistical arbitrage",
      "Risk arbitrage"
    ],
    correctOption: "Convertible arbitrage",
    difficulty: 5,
    industryVerticals: ["FIG"],
    roles: ["Sales & Trading"],
    topics: ["Fixed Income Analysis", "Equity Analysis", "Derivatives & Structured Products"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Quantitative Analysis
  {
    text: "Which statistical measure is most appropriate for assessing the tail risk of a trading portfolio?",
    answer: "Conditional Value at Risk (CVaR)",
    explanation: "Conditional Value at Risk (CVaR), also known as Expected Shortfall, is the most appropriate measure for assessing tail risk in a trading portfolio. Unlike standard Value at Risk (VaR) which only indicates the minimum loss at a given confidence level, CVaR calculates the expected loss given that the loss exceeds the VaR threshold. This provides a more comprehensive view of extreme loss scenarios and better captures the severity of potential losses in the tail of the distribution, making it particularly valuable for portfolios with non-normal return distributions.",
    type: "multiple_choice",
    options: [
      "Standard deviation",
      "Beta",
      "Sharpe ratio",
      "Conditional Value at Risk (CVaR)"
    ],
    correctOption: "Conditional Value at Risk (CVaR)",
    difficulty: 6,
    industryVerticals: ["FIG"],
    roles: ["Quantitative Analysis", "Risk Management"],
    topics: ["Risk Management", "Quantitative Methods"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // ESG Advisory
  {
    text: "How should the financial impact of carbon pricing mechanisms be incorporated into a company valuation model?",
    answer: "As an explicit line item in cash flow projections based on emissions intensity and regulatory scenarios",
    explanation: "The financial impact of carbon pricing should be incorporated as an explicit line item in cash flow projections based on emissions intensity and regulatory scenarios. This approach provides the most transparent and accurate representation of how carbon pricing will affect future cash flows. By modeling different carbon price trajectories across regulatory scenarios and applying them to the company's projected emissions (adjusted for planned reduction initiatives), analysts can quantify the potential financial impact and incorporate this into the overall valuation.",
    type: "multiple_choice",
    options: [
      "As an explicit line item in cash flow projections based on emissions intensity and regulatory scenarios",
      "Through a higher discount rate to reflect increased regulatory risk",
      "By applying a valuation multiple discount compared to industry peers",
      "By excluding carbon-intensive assets from the valuation entirely"
    ],
    correctOption: "As an explicit line item in cash flow projections based on emissions intensity and regulatory scenarios",
    difficulty: 5,
    industryVerticals: ["Cross-Industry", "Energy"],
    roles: ["ESG Advisory", "Equity Research"],
    topics: ["ESG Analysis", "Valuation", "DCF"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Corporate Development
  {
    text: "What approach should a corporate development team use to evaluate potential acquisition targets in adjacent markets?",
    answer: "Strategic fit analysis combined with synergy-adjusted DCF valuation",
    explanation: "When evaluating acquisition targets in adjacent markets, corporate development teams should use strategic fit analysis combined with synergy-adjusted DCF valuation. This approach first assesses how well the target aligns with the company's strategic objectives, capabilities, and growth plans. Then, it quantifies the financial impact through a DCF model that explicitly incorporates revenue and cost synergies, implementation costs, and integration risks. This comprehensive method balances strategic rationale with financial discipline, ensuring that acquisitions create sustainable value rather than just growth for growth's sake.",
    type: "multiple_choice",
    options: [
      "Pure multiple-based valuation using industry benchmarks",
      "Strategic fit analysis combined with synergy-adjusted DCF valuation",
      "Leveraged buyout analysis focused on financial returns",
      "Comparable transaction analysis only"
    ],
    correctOption: "Strategic fit analysis combined with synergy-adjusted DCF valuation",
    difficulty: 5,
    industryVerticals: ["Cross-Industry"],
    roles: ["Corporate Development", "M&A"],
    topics: ["M&A / Synergy Modeling", "Valuation", "DCF"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Venture Capital
  {
    text: "What valuation methodology is most appropriate for a pre-revenue SaaS startup with early customer traction?",
    answer: "Comparable company analysis based on forward revenue multiples with stage-appropriate discounts",
    explanation: "For pre-revenue SaaS startups with early customer traction, comparable company analysis based on forward revenue multiples with stage-appropriate discounts is most appropriate. This approach starts with public SaaS company multiples, then applies discounts for the startup's earlier stage, execution risk, and illiquidity. The forward revenue projections should be based on current customer acquisition rates, conversion metrics, and realistic growth trajectories. This method balances market-based valuation with the specific risk profile of early-stage ventures, while recognizing the value of demonstrated customer adoption.",
    type: "multiple_choice",
    options: [
      "Discounted cash flow analysis",
      "Comparable company analysis based on forward revenue multiples with stage-appropriate discounts",
      "Venture capital method using exit value and expected return",
      "Asset-based valuation"
    ],
    correctOption: "Comparable company analysis based on forward revenue multiples with stage-appropriate discounts",
    difficulty: 5,
    industryVerticals: ["TMT", "Fintech"],
    roles: ["Venture Capital", "Investment Banking"],
    topics: ["Venture Capital Valuation", "Comparable Company Analysis"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Asset Management
  {
    text: "Which performance metric best captures both risk and return for evaluating asset managers?",
    answer: "Information Ratio",
    explanation: "The Information Ratio best captures both risk and return for evaluating asset managers because it measures excess returns relative to a benchmark divided by the tracking error (standard deviation of those excess returns). This metric effectively shows how consistently a manager outperforms their benchmark on a risk-adjusted basis. Unlike the Sharpe ratio which uses total volatility, the Information Ratio specifically measures the risk taken to achieve returns above the benchmark, making it particularly valuable for assessing active management skill.",
    type: "multiple_choice",
    options: [
      "Total return",
      "Sharpe Ratio",
      "Information Ratio",
      "Alpha"
    ],
    correctOption: "Information Ratio",
    difficulty: 4,
    industryVerticals: ["FIG"],
    roles: ["Asset Management", "Equity Research"],
    topics: ["Portfolio Theory", "Risk Management"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // New Topics
  
  // ESG Analysis
  {
    text: "How should a company's carbon transition plan be evaluated from an investment perspective?",
    answer: "Assess the plan's impact on future cash flows, capital expenditure requirements, and competitive positioning",
    explanation: "From an investment perspective, a carbon transition plan should be evaluated by assessing its impact on future cash flows, capital expenditure requirements, and competitive positioning. This approach quantifies the financial implications of the transition strategy, including potential revenue opportunities from low-carbon products, cost savings from efficiency measures, and required investments in new technologies. It also considers how the plan affects the company's market position relative to peers and its resilience to changing regulations and consumer preferences, providing a comprehensive view of long-term value creation or destruction.",
    type: "multiple_choice",
    options: [
      "Focus exclusively on current ESG ratings and scores",
      "Evaluate only the emissions reduction targets against industry benchmarks",
      "Assess the plan's impact on future cash flows, capital expenditure requirements, and competitive positioning",
      "Consider only the governance structure overseeing climate initiatives"
    ],
    correctOption: "Assess the plan's impact on future cash flows, capital expenditure requirements, and competitive positioning",
    difficulty: 5,
    industryVerticals: ["Cross-Industry", "Energy"],
    roles: ["ESG Advisory", "Equity Research"],
    topics: ["ESG Analysis", "Valuation"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Derivatives & Structured Products
  {
    text: "What is the primary advantage of using total return swaps over physical ownership for institutional investors seeking equity exposure?",
    answer: "Leverage and reduced funding costs",
    explanation: "The primary advantage of total return swaps over physical ownership for institutional investors is leverage and reduced funding costs. Total return swaps typically require only an initial margin payment rather than the full notional amount, allowing investors to gain exposure to a larger portfolio with less capital. This synthetic exposure eliminates the need to fund the entire position, reducing financing costs and potentially enhancing returns. Additionally, total return swaps can offer operational efficiencies, tax advantages in certain jurisdictions, and the ability to gain exposure to markets that might be difficult to access directly.",
    type: "multiple_choice",
    options: [
      "Elimination of market risk",
      "Guaranteed returns",
      "Leverage and reduced funding costs",
      "Elimination of counterparty risk"
    ],
    correctOption: "Leverage and reduced funding costs",
    difficulty: 6,
    industryVerticals: ["FIG"],
    roles: ["Sales & Trading", "Asset Management"],
    topics: ["Derivatives & Structured Products", "Risk Management"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Foreign Exchange
  {
    text: "Which hedging strategy would be most appropriate for a company with highly probable but not contractually certain foreign currency revenues?",
    answer: "Rolling forward contracts with decreasing hedge ratios for more distant periods",
    explanation: "For highly probable but not contractually certain foreign currency revenues, rolling forward contracts with decreasing hedge ratios for more distant periods is the most appropriate hedging strategy. This approach provides certainty for near-term cash flows while acknowledging the increasing uncertainty of forecasts over time. By reducing the hedge ratio for more distant periods (e.g., 80% for 3 months out, 60% for 6 months, 40% for 9 months), the company balances protection against adverse currency movements with flexibility to adjust to changing business conditions. The rolling nature of the program allows for regular reassessment as forecasts become more certain.",
    type: "multiple_choice",
    options: [
      "Single long-dated forward contract for the full amount",
      "Currency options for the full forecasted amount",
      "No hedging due to forecast uncertainty",
      "Rolling forward contracts with decreasing hedge ratios for more distant periods"
    ],
    correctOption: "Rolling forward contracts with decreasing hedge ratios for more distant periods",
    difficulty: 5,
    industryVerticals: ["Cross-Industry"],
    roles: ["Treasury", "Risk Management"],
    topics: ["Foreign Exchange", "Risk Management", "Derivatives & Structured Products"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Commodities
  {
    text: "For an airline seeking to hedge jet fuel costs, which hedging instrument would provide the best balance of cost and effectiveness?",
    answer: "Crude oil swaps combined with crack spread options",
    explanation: "For airlines hedging jet fuel costs, crude oil swaps combined with crack spread options provide the best balance of cost and effectiveness. This strategy addresses the two components of jet fuel price risk: underlying crude oil prices and the refining margin (crack spread). Crude oil swaps offer liquidity and lower transaction costs for the bulk of the exposure, while crack spread options specifically address the risk of widening spreads between crude and jet fuel. This combination is more cost-effective than using jet fuel derivatives exclusively (which have higher premiums due to lower liquidity) while providing better protection than crude-only hedges which don't address basis risk.",
    type: "multiple_choice",
    options: [
      "Jet fuel forward contracts exclusively",
      "Crude oil swaps combined with crack spread options",
      "Heating oil futures only",
      "Out-of-the-money jet fuel call options"
    ],
    correctOption: "Crude oil swaps combined with crack spread options",
    difficulty: 6,
    industryVerticals: ["Energy", "Transportation & Infrastructure"],
    roles: ["Risk Management", "Treasury"],
    topics: ["Commodities", "Risk Management", "Derivatives & Structured Products"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Fixed Income Analysis
  {
    text: "How should an analyst adjust their valuation approach when analyzing a corporate bond with embedded call options?",
    answer: "Use option-adjusted spread (OAS) analysis to value the optionality separately from the underlying bond",
    explanation: "When analyzing corporate bonds with embedded call options, analysts should use option-adjusted spread (OAS) analysis to value the optionality separately from the underlying bond. This approach uses interest rate simulations to determine the value of the embedded option across multiple rate scenarios, then deducts this option value from the bond price to derive the value of the straight bond component. The resulting option-adjusted spread represents the additional yield over the risk-free rate after accounting for the call option, providing a more accurate measure of credit risk and allowing for proper comparison with non-callable bonds.",
    type: "multiple_choice",
    options: [
      "Ignore the call option if interest rates are expected to rise",
      "Use option-adjusted spread (OAS) analysis to value the optionality separately from the underlying bond",
      "Apply a fixed discount to the bond's price based on industry averages",
      "Focus only on yield-to-worst as the primary valuation metric"
    ],
    correctOption: "Use option-adjusted spread (OAS) analysis to value the optionality separately from the underlying bond",
    difficulty: 6,
    industryVerticals: ["FIG"],
    roles: ["Fixed Income Research", "Sales & Trading"],
    topics: ["Fixed Income Analysis", "Derivatives & Structured Products"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Equity Analysis
  {
    text: "Which approach is most appropriate for valuing high-growth technology companies with negative current earnings?",
    answer: "Revenue multiples with cohort analysis of margin progression",
    explanation: "For high-growth technology companies with negative earnings, revenue multiples with cohort analysis of margin progression is the most appropriate valuation approach. This method recognizes that current profitability is sacrificed for growth, while providing a framework to evaluate the quality and sustainability of that growth. By analyzing how different customer cohorts mature in terms of retention, monetization, and cost-to-serve, analysts can project when and how the company will achieve profitability. This approach is superior to simple revenue multiples as it incorporates unit economics and provides a path to positive cash flow, allowing for more nuanced comparisons between companies at similar growth stages.",
    type: "multiple_choice",
    options: [
      "P/E multiples based on comparable profitable companies",
      "Asset-based valuation",
      "Revenue multiples with cohort analysis of margin progression",
      "Dividend discount model"
    ],
    correctOption: "Revenue multiples with cohort analysis of margin progression",
    difficulty: 5,
    industryVerticals: ["TMT"],
    roles: ["Equity Research", "Investment Banking"],
    topics: ["Equity Analysis", "Valuation", "Comparable Company Analysis"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Merger Arbitrage
  {
    text: "In evaluating a merger arbitrage opportunity, which factor is most critical in determining position sizing?",
    answer: "Probability-weighted assessment of deal closure and break scenarios",
    explanation: "In merger arbitrage, position sizing should be primarily determined by a probability-weighted assessment of deal closure and break scenarios. This approach quantifies the risk-reward profile by multiplying the potential return in a successful deal by its probability and comparing it to the potential loss in a break scenario weighted by its probability. The analysis should incorporate regulatory approval likelihood, financing conditions, shareholder approval requirements, and other deal-specific factors. This methodology provides a more sophisticated framework than simple spread-based sizing, allowing arbitrageurs to allocate capital efficiently across multiple opportunities based on their risk-adjusted expected returns.",
    type: "multiple_choice",
    options: [
      "Current spread between trading price and offer price",
      "Time to expected deal completion",
      "Probability-weighted assessment of deal closure and break scenarios",
      "Acquirer's credit rating"
    ],
    correctOption: "Probability-weighted assessment of deal closure and break scenarios",
    difficulty: 6,
    industryVerticals: ["Cross-Industry"],
    roles: ["Sales & Trading", "Hedge Fund"],
    topics: ["Merger Arbitrage", "Risk Management"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Distressed Debt
  {
    text: "What valuation approach is most appropriate for the debt of a company in financial distress with a high probability of bankruptcy?",
    answer: "Sum-of-the-parts analysis with liquidation and restructuring scenarios",
    explanation: "For distressed companies with high bankruptcy probability, sum-of-the-parts analysis with liquidation and restructuring scenarios is the most appropriate valuation approach. This method values each asset class separately under different scenarios, accounting for their unique characteristics and recovery rates. It then applies probability weightings to liquidation outcomes (where assets are sold) and restructuring outcomes (where the company continues operating with a new capital structure). This approach recognizes that different debt tranches have different claims on specific assets and incorporates the legal framework of bankruptcy proceedings, providing a more accurate assessment than enterprise-level valuation methods.",
    type: "multiple_choice",
    options: [
      "Traditional DCF based on management projections",
      "Trading comparable analysis using healthy industry peers",
      "Sum-of-the-parts analysis with liquidation and restructuring scenarios",
      "Dividend discount model"
    ],
    correctOption: "Sum-of-the-parts analysis with liquidation and restructuring scenarios",
    difficulty: 7,
    industryVerticals: ["Cross-Industry"],
    roles: ["Restructuring", "Fixed Income Research"],
    topics: ["Distressed Debt", "Restructuring / Distressed Analysis"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Venture Capital Valuation
  {
    text: "What is the most appropriate method for determining the pre-money valuation of a Series B enterprise SaaS company growing at 150% annually?",
    answer: "Forward revenue multiple based on comparable public companies with growth-adjusted discount",
    explanation: "For a high-growth Series B enterprise SaaS company, a forward revenue multiple based on comparable public companies with a growth-adjusted discount is most appropriate. This approach starts with the revenue multiples of public SaaS companies, then adjusts for the startup's higher growth rate using a growth-adjusted multiple framework (e.g., comparing EV/Revenue to growth rates). A discount is then applied to account for the company's earlier stage, execution risk, and illiquidity. This method balances market-based valuation with the specific characteristics of high-growth SaaS businesses, where revenue growth and scalability are more relevant metrics than current profitability.",
    type: "multiple_choice",
    options: [
      "Discounted cash flow analysis with 10-year projections",
      "Last round valuation with standard markup",
      "Forward revenue multiple based on comparable public companies with growth-adjusted discount",
      "Replacement cost of technology assets"
    ],
    correctOption: "Forward revenue multiple based on comparable public companies with growth-adjusted discount",
    difficulty: 6,
    industryVerticals: ["TMT"],
    roles: ["Venture Capital", "Investment Banking"],
    topics: ["Venture Capital Valuation", "Comparable Company Analysis"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    }
  },
  
  // Open-ended questions for advanced topics
  
  // ESG Analysis (Open-ended)
  {
    text: "How should investment banks incorporate climate transition risk into their valuation models for oil and gas companies? Describe the key components that should be included and how they should be quantified.",
    answer: "Investment banks should incorporate climate transition risk into oil and gas valuations through a comprehensive framework that includes: 1) Carbon pricing scenarios - Model explicit carbon taxes/prices across multiple regulatory pathways (e.g., Paris-aligned, business-as-usual, accelerated transition) and apply them to the company's emissions profile; 2) Demand scenarios - Develop long-term commodity price forecasts under different energy transition scenarios, reflecting potential demand destruction from electrification and renewable adoption; 3) Stranded asset risk - Assess the company's reserves using breakeven analysis to identify assets that may become uneconomical under various price and carbon tax scenarios; 4) Capital allocation flexibility - Evaluate the company's ability to redirect capital from traditional to low-carbon investments; 5) Technology adaptation - Assess investments in carbon capture, hydrogen, or renewable energy that could mitigate transition risks; and 6) Policy and litigation exposure - Quantify potential costs from increased regulation and climate-related litigation. These components should be integrated into DCF models through scenario analysis, with each scenario assigned a probability to derive a risk-adjusted valuation. Sensitivity analysis should be performed on key variables like carbon prices and commodity prices to understand valuation impacts. The analysis should extend beyond traditional 5-10 year forecasts to capture long-term transition risks, potentially using terminal value adjustments to reflect post-transition business models.",
    explanation: "This question tests understanding of how climate-related financial risks affect traditional valuation methodologies. A strong answer demonstrates knowledge of both ESG risk factors and fundamental valuation techniques, showing how qualitative sustainability factors can be translated into quantitative financial impacts. The question is particularly relevant as financial regulators increasingly require climate risk disclosure and investors demand more sophisticated analysis of transition risks.",
    type: "open_ended",
    difficulty: 7,
    industryVerticals: ["Energy", "Oil & Gas"],
    roles: ["ESG Advisory", "Equity Research"],
    topics: ["ESG Analysis", "Valuation", "Risk Management"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    },
    rubric: {
      criteria: [
        {
          concept: "Scenario Analysis Framework",
          description: "Demonstrates understanding of how to develop and apply multiple climate transition scenarios to valuation models",
          weight: 25
        },
        {
          concept: "Financial Impact Quantification",
          description: "Shows ability to translate climate risks into specific financial impacts on cash flows, capital expenditures, and terminal values",
          weight: 25
        },
        {
          concept: "Industry-Specific Risk Factors",
          description: "Identifies oil and gas sector-specific transition risks including stranded assets, changing demand patterns, and regulatory pressures",
          weight: 25
        },
        {
          concept: "Practical Implementation",
          description: "Provides practical guidance on implementing the approach within traditional valuation models with appropriate time horizons and probability weightings",
          weight: 25
        }
      ]
    }
  },
  
  // Derivatives & Structured Products (Open-ended)
  {
    text: "Design a structured derivative solution for a multinational corporation with operations in emerging markets that faces both currency and commodity price risks. Explain the structure, pricing considerations, accounting implications, and potential drawbacks.",
    answer: "For a multinational corporation with emerging market operations facing both currency and commodity price risks, I would design a cross-asset basket swap with the following structure: 1) Structure: The corporation enters a customized swap that combines currency and commodity exposures in a single instrument. The notional value is split proportionally to the company's risk exposures (e.g., 60% currency, 40% commodity). The currency component exchanges emerging market currency cash flows for USD at predetermined rates, while the commodity component exchanges floating commodity prices for fixed prices. The correlation between these risks is incorporated through basket options that provide additional protection if both risks move adversely simultaneously. 2) Pricing considerations: The pricing would account for several factors: correlation between currency and commodity risks (potentially offering a discount if they're negatively correlated); liquidity premiums for emerging market currencies; forward curves for both currencies and commodities; implied volatilities from option markets; counterparty credit risk adjustments; and bank funding costs. 3) Accounting implications: The structure would be designed to qualify for hedge accounting under IFRS 9/ASC 815, with the ability to designate separate risk components. Documentation would include effectiveness testing methodologies, with regression analysis demonstrating the hedge relationship. The solution would incorporate component hedging to allow separate designation of currency and commodity risks. 4) Potential drawbacks: Key drawbacks include: basis risk if the hedged currencies/commodities don't perfectly match actual exposures; potential mark-to-market volatility if hedge accounting isn't achieved; counterparty risk requiring credit support annexes and potential collateral posting; reduced flexibility compared to separate hedges; complexity in valuation requiring specialized models; and potentially higher costs than standard instruments due to customization and cross-asset correlation pricing.",
    explanation: "This question tests the ability to design complex financial solutions that address multiple risk factors simultaneously. It requires understanding of derivatives pricing, cross-asset correlations, emerging market considerations, accounting standards, and practical implementation challenges. The ideal answer demonstrates both technical knowledge of derivative structures and practical business considerations for corporate risk management.",
    type: "open_ended",
    difficulty: 7,
    industryVerticals: ["Cross-Industry"],
    roles: ["Sales & Trading", "Risk Management"],
    topics: ["Derivatives & Structured Products", "Risk Management", "Foreign Exchange"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    },
    rubric: {
      criteria: [
        {
          concept: "Solution Design",
          description: "Creates an appropriate derivative structure that effectively addresses both currency and commodity risks in emerging markets",
          weight: 25
        },
        {
          concept: "Pricing Methodology",
          description: "Demonstrates understanding of how to price complex cross-asset derivatives, including correlation effects and emerging market factors",
          weight: 25
        },
        {
          concept: "Accounting Treatment",
          description: "Explains relevant accounting considerations under IFRS/GAAP and strategies to achieve hedge accounting treatment",
          weight: 25
        },
        {
          concept: "Risk Assessment",
          description: "Identifies potential drawbacks and implementation challenges with appropriate risk mitigation strategies",
          weight: 25
        }
      ]
    }
  },
  
  // Venture Capital Valuation (Open-ended)
  {
    text: "You're evaluating a Series C investment in a B2B AI software company with $15M ARR growing at 120% year-over-year. Develop a comprehensive valuation framework, including key metrics to analyze, appropriate methodologies, and how to account for the company's AI-specific value drivers and risks.",
    answer: "For valuing a Series C B2B AI software company with $15M ARR growing at 120% YoY, I would implement a multi-faceted valuation framework: 1) Growth-adjusted revenue multiple approach: Start with public AI software comparables, focusing on companies with similar business models and growth profiles. Calculate forward revenue multiples (typically EV/NTM Revenue) and plot against growth rates to establish a regression line. For a company growing at 120%, identify where this growth rate falls on the curve, then apply a private company discount (typically 25-40% for Series C) to account for illiquidity, execution risk, and earlier stage. 2) Cohort analysis and unit economics: Analyze key SaaS metrics including: Net Dollar Retention (expecting 120%+ for top AI companies); Gross Margin (examining AI-specific costs like computing infrastructure and data acquisition); CAC Payback Period (expecting 12-24 months); LTV/CAC ratio (looking for 3x+); and Rule of 40 performance (growth rate + profit margin). 3) AI-specific value drivers: Evaluate proprietary data assets (volume, uniqueness, and defensibility); AI talent bench strength and retention; model performance metrics versus competitors; computing infrastructure efficiency; and potential for network effects through data flywheel. 4) Scenario-based DCF: Develop 5-year projections under multiple scenarios: a) Base case: Growth gradually decelerating from 120% to 40% by year 5, with margins expanding as scale increases; b) Upside case: Sustained high growth through new AI applications and market expansion; c) Downside case: Faster growth deceleration due to competition or AI commoditization. Use a higher discount rate (25-30%) reflecting technology and execution risks. 5) Exit analysis: Model potential exit multiples based on projected growth rates at exit, with scenarios for strategic acquisition versus IPO. For a successful AI company, strategic acquisition multiples might be 2-3x higher than traditional software companies. 6) Validation through transaction comparables: Analyze recent private AI software financings, adjusting for market conditions and company-specific factors. The final valuation would weight these approaches based on their reliability, with the growth-adjusted multiple approach typically receiving the highest weight for a high-growth Series C company. I would present a valuation range rather than a point estimate, acknowledging the inherent uncertainty in projecting AI technology adoption and competitive dynamics.",
    explanation: "This question tests the ability to value high-growth technology companies with emerging AI capabilities. It requires synthesizing traditional valuation methodologies with an understanding of SaaS metrics, AI-specific value drivers, and the unique characteristics of venture-stage companies. The ideal answer demonstrates both technical valuation skills and strategic thinking about technology evolution and competitive dynamics.",
    type: "open_ended",
    difficulty: 7,
    industryVerticals: ["TMT"],
    roles: ["Venture Capital", "Investment Banking"],
    topics: ["Venture Capital Valuation", "Valuation", "Comparable Company Analysis"],
    source: {
      type: "base",
      timestamp: new Date(),
      cached: false
    },
    rubric: {
      criteria: [
        {
          concept: "SaaS Metrics Analysis",
          description: "Demonstrates understanding of key SaaS metrics and how to apply them to high-growth B2B software companies",
          weight: 25
        },
        {
          concept: "AI-Specific Value Drivers",
          description: "Identifies and evaluates unique value drivers and risks specific to AI software companies",
          weight: 25
        },
        {
          concept: "Valuation Methodology Selection",
          description: "Selects and applies appropriate valuation methodologies for a high-growth Series C company",
          weight: 25
        },
        {
          concept: "Growth and Risk Assessment",
          description: "Analyzes growth sustainability and incorporates risk factors into the valuation framework",
          weight: 25
        }
      ]
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Insert new questions
    await Question.insertMany(newCategoryQuestions);
    console.log(`Inserted ${newCategoryQuestions.length} new category questions`);

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
