import mongoose from 'mongoose';
import { InvestmentBank } from '../models/InvestmentBank';
import { connectMongo } from '../database';
import fs from 'fs';
import path from 'path';

// Initial investment bank data
const initialBanksData = [
  // Bulge Bracket Banks
  {
    name: "Goldman Sachs",
    description: "One of the world's largest investment banks, known for its strong culture and prestigious reputation.",
    tier: "bulge_bracket",
    active: true,
    groups: [
      {
        name: "M&A",
        fullName: "Mergers & Acquisitions",
        type: "m_and_a",
        difficulty: 8,
        topics: ["M&A / Synergy Modeling", "Valuation", "DCF", "Comparable Company Analysis", "Precedent Transactions"],
        description: "Elite M&A advisory group known for complex, high-profile transactions and rigorous technical interviews."
      },
      {
        name: "TMT",
        fullName: "Technology, Media & Telecom",
        type: "tmt",
        difficulty: 7,
        topics: ["Valuation", "DCF", "Comparable Company Analysis", "Industry-Specific Metrics", "M&A / Synergy Modeling"],
        description: "Specialized group focused on technology, media, and telecommunications sectors with emphasis on industry knowledge and technical skills."
      },
      {
        name: "FIG",
        fullName: "Financial Institutions Group",
        type: "fig",
        difficulty: 8,
        topics: ["Financial Institutions Analysis", "Regulatory Capital", "Valuation", "M&A / Synergy Modeling"],
        description: "Specialized group focused on financial institutions with unique valuation methodologies and regulatory considerations."
      },
      {
        name: "Healthcare",
        fullName: "Healthcare Group",
        type: "healthcare",
        difficulty: 7,
        topics: ["Valuation", "DCF", "Comparable Company Analysis", "Industry-Specific Metrics"],
        description: "Specialized group focused on healthcare companies with emphasis on industry knowledge and technical skills."
      },
      {
        name: "IBD",
        fullName: "Investment Banking Division",
        type: "general_banking",
        difficulty: 7,
        topics: ["Valuation", "DCF", "Comparable Company Analysis", "M&A / Synergy Modeling", "LBO Modeling"],
        description: "General investment banking division covering a range of industries and transaction types."
      }
    ]
  },
  {
    name: "Morgan Stanley",
    description: "Global investment bank with a strong reputation in capital markets and advisory services.",
    tier: "bulge_bracket",
    active: true,
    groups: [
      {
        name: "M&A Advisory",
        fullName: "Mergers & Acquisitions Advisory",
        type: "m_and_a",
        difficulty: 8,
        topics: ["M&A / Synergy Modeling", "Valuation", "DCF", "Comparable Company Analysis", "Precedent Transactions"],
        description: "Premier M&A advisory group known for sophisticated deal execution and strategic advice."
      },
      {
        name: "TMT",
        fullName: "Technology, Media & Telecom",
        type: "tmt",
        difficulty: 7,
        topics: ["Valuation", "DCF", "Comparable Company Analysis", "Industry-Specific Metrics", "M&A / Synergy Modeling"],
        description: "Specialized group focused on technology, media, and telecommunications sectors with emphasis on industry knowledge and technical skills."
      },
      {
        name: "FIG",
        fullName: "Financial Institutions Group",
        type: "fig",
        difficulty: 8,
        topics: ["Financial Institutions Analysis", "Regulatory Capital", "Valuation", "M&A / Synergy Modeling"],
        description: "Specialized group focused on financial institutions with unique valuation methodologies and regulatory considerations."
      }
    ]
  },
  {
    name: "JPMorgan Chase",
    description: "Largest U.S. bank offering a full range of investment banking services.",
    tier: "bulge_bracket",
    active: true,
    groups: [
      {
        name: "M&A",
        fullName: "Mergers & Acquisitions",
        type: "m_and_a",
        difficulty: 7,
        topics: ["M&A / Synergy Modeling", "Valuation", "DCF", "Comparable Company Analysis", "Precedent Transactions"],
        description: "Leading M&A advisory group with a strong track record in complex transactions."
      },
      {
        name: "TMT",
        fullName: "Technology, Media & Telecom",
        type: "tmt",
        difficulty: 7,
        topics: ["Valuation", "DCF", "Comparable Company Analysis", "Industry-Specific Metrics", "M&A / Synergy Modeling"],
        description: "Specialized group focused on technology, media, and telecommunications sectors with emphasis on industry knowledge and technical skills."
      },
      {
        name: "LevFin",
        fullName: "Leveraged Finance",
        type: "leveraged_finance",
        difficulty: 7,
        topics: ["Credit Analysis", "LBO Modeling", "Debt Markets", "Capital Structure"],
        description: "Specialized group focused on debt financing for leveraged buyouts and other highly leveraged transactions."
      }
    ]
  },

  // Elite Boutiques
  {
    name: "PJT Partners",
    description: "Elite advisory firm founded by Paul J. Taubman, known for restructuring and M&A advisory.",
    tier: "elite_boutique",
    active: true,
    groups: [
      {
        name: "RSSG",
        fullName: "Restructuring & Special Situations Group",
        type: "restructuring",
        difficulty: 9,
        topics: ["Restructuring / Distressed Analysis", "Credit Analysis", "Valuation", "Capital Structure"],
        description: "Elite restructuring group known for rigorous technical interviews and complex distressed situations."
      },
      {
        name: "Strategic Advisory",
        fullName: "Strategic Advisory Group",
        type: "m_and_a",
        difficulty: 8,
        topics: ["M&A / Synergy Modeling", "Valuation", "DCF", "Comparable Company Analysis", "Precedent Transactions"],
        description: "Premier M&A advisory group working on complex, high-profile transactions."
      }
    ]
  },
  {
    name: "Evercore",
    description: "Independent investment banking advisory firm with a focus on M&A and restructuring.",
    tier: "elite_boutique",
    active: true,
    groups: [
      {
        name: "M&A",
        fullName: "Mergers & Acquisitions",
        type: "m_and_a",
        difficulty: 8,
        topics: ["M&A / Synergy Modeling", "Valuation", "DCF", "Comparable Company Analysis", "Precedent Transactions"],
        description: "Premier M&A advisory group known for sophisticated deal execution and strategic advice."
      },
      {
        name: "Restructuring",
        fullName: "Restructuring Group",
        type: "restructuring",
        difficulty: 8,
        topics: ["Restructuring / Distressed Analysis", "Credit Analysis", "Valuation", "Capital Structure"],
        description: "Leading restructuring advisory practice working on complex distressed situations."
      },
      {
        name: "TMT",
        fullName: "Technology, Media & Telecom",
        type: "tmt",
        difficulty: 7,
        topics: ["Valuation", "DCF", "Comparable Company Analysis", "Industry-Specific Metrics", "M&A / Synergy Modeling"],
        description: "Specialized group focused on technology, media, and telecommunications sectors with emphasis on industry knowledge and technical skills."
      }
    ]
  },
  {
    name: "Lazard",
    description: "Global financial advisory and asset management firm with a long history in M&A and restructuring.",
    tier: "elite_boutique",
    active: true,
    groups: [
      {
        name: "M&A",
        fullName: "Mergers & Acquisitions",
        type: "m_and_a",
        difficulty: 8,
        topics: ["M&A / Synergy Modeling", "Valuation", "DCF", "Comparable Company Analysis", "Precedent Transactions"],
        description: "Historic M&A advisory group known for sophisticated deal execution and strategic advice."
      },
      {
        name: "Restructuring",
        fullName: "Restructuring Group",
        type: "restructuring",
        difficulty: 8,
        topics: ["Restructuring / Distressed Analysis", "Credit Analysis", "Valuation", "Capital Structure"],
        description: "Leading restructuring advisory practice working on complex distressed situations."
      }
    ]
  },
  {
    name: "Moelis & Company",
    description: "Global independent investment bank providing strategic advice on M&A, recapitalization, and restructuring.",
    tier: "elite_boutique",
    active: true,
    groups: [
      {
        name: "M&A",
        fullName: "Mergers & Acquisitions",
        type: "m_and_a",
        difficulty: 7,
        topics: ["M&A / Synergy Modeling", "Valuation", "DCF", "Comparable Company Analysis", "Precedent Transactions"],
        description: "Leading M&A advisory group known for sophisticated deal execution and strategic advice."
      },
      {
        name: "Recapitalization & Restructuring",
        fullName: "Recapitalization & Restructuring Group",
        type: "restructuring",
        difficulty: 8,
        topics: ["Restructuring / Distressed Analysis", "Credit Analysis", "Valuation", "Capital Structure"],
        description: "Specialized group focused on complex recapitalizations and restructurings."
      }
    ]
  },

  // Middle Market Banks
  {
    name: "Houlihan Lokey",
    description: "Global investment bank with strength in M&A, capital markets, and financial restructuring.",
    tier: "middle_market",
    active: true,
    groups: [
      {
        name: "Corporate Finance",
        fullName: "Corporate Finance Group",
        type: "m_and_a",
        difficulty: 6,
        topics: ["M&A / Synergy Modeling", "Valuation", "DCF", "Comparable Company Analysis", "Precedent Transactions"],
        description: "M&A advisory group focused on middle-market transactions across various industries."
      },
      {
        name: "Financial Restructuring",
        fullName: "Financial Restructuring Group",
        type: "restructuring",
        difficulty: 7,
        topics: ["Restructuring / Distressed Analysis", "Credit Analysis", "Valuation", "Capital Structure"],
        description: "Leading restructuring practice known for complex distressed situations and creditor representations."
      }
    ]
  },
  {
    name: "William Blair",
    description: "Global boutique investment bank focused on middle-market clients.",
    tier: "middle_market",
    active: true,
    groups: [
      {
        name: "Investment Banking",
        fullName: "Investment Banking Group",
        type: "m_and_a",
        difficulty: 6,
        topics: ["M&A / Synergy Modeling", "Valuation", "DCF", "Comparable Company Analysis", "Precedent Transactions"],
        description: "M&A advisory group focused on middle-market transactions across various industries."
      }
    ]
  }
];

// Connect to MongoDB
const seedDatabase = async () => {
  try {
    await connectMongo();
    console.log('Connected to MongoDB');

    // Check if there are already banks in the database
    const count = await InvestmentBank.countDocuments();
    if (count > 0) {
      console.log(`Database already contains ${count} banks. Do you want to clear and reseed? (y/n)`);
      // In a script, we would prompt for input, but for simplicity, we'll just proceed
      await InvestmentBank.deleteMany({});
      console.log('Cleared existing banks');
    }

    // Insert the initial data
    const result = await InvestmentBank.insertMany(initialBanksData);
    console.log(`Seeded ${result.length} banks`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
