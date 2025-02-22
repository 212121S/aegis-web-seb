import mongoose from 'mongoose';
import { University } from '../models/University';
import universities from '../data/universities.json';

async function populateUniversities() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aegis';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing universities
    await University.deleteMany({});
    console.log('Cleared existing universities');

    // Prepare university data
    const universityData = [
      ...universities.US.map(uni => ({
        ...uni,
        country: 'United States'
      })),
      ...universities.International
    ];

    // Insert universities
    const result = await University.insertMany(universityData);
    console.log(`Added ${result.length} universities`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

populateUniversities();
