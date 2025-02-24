import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CollegeScorecardService from '../services/CollegeScorecardService';
import { University } from '../models/University';

// Load environment variables
dotenv.config();

async function populateCache() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis');
    console.log('Connected to MongoDB');

    // Clear existing universities
    await University.deleteMany({});
    console.log('Cleared existing universities');

    const collegeService = CollegeScorecardService.getInstance();

    // Fetch and cache universities in batches
    console.log('Starting university cache population...');
    await collegeService.refreshCache();
    console.log('University cache population complete');

    // Log stats
    const total = await University.countDocuments();
    console.log(`Total universities cached: ${total}`);

    process.exit(0);
  } catch (error) {
    console.error('Error populating university cache:', error);
    process.exit(1);
  }
}

populateCache();
