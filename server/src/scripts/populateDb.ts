import mongoose from 'mongoose';
import { University } from '../models/University';
import universities from '../data/universities.json';
import dotenv from 'dotenv';

dotenv.config();

async function populateUniversities() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aegis';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing universities
    console.log('Clearing existing universities...');
    await University.deleteMany({});
    console.log('Cleared existing universities');

    // Prepare university data
    const universityData = [
      ...universities.US.map(uni => ({
        name: uni.name,
        country: uni.country,
        type: uni.type,
        domain: uni.domain
      })),
      ...universities.International.map(uni => ({
        name: uni.name,
        country: uni.country,
        type: uni.type,
        domain: uni.domain
      }))
    ];

    // Insert universities
    console.log('Inserting universities...');
    const result = await University.insertMany(universityData);
    console.log(`Successfully added ${result.length} universities`);

    // Log some stats
    const countByCountry = await University.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } }
    ]);
    console.log('\nUniversities by country:');
    countByCountry.forEach(stat => {
      console.log(`${stat._id}: ${stat.count}`);
    });

    const countByType = await University.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    console.log('\nUniversities by type:');
    countByType.forEach(stat => {
      console.log(`${stat._id}: ${stat.count}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the population script
console.log('Starting database population...');
populateUniversities();
