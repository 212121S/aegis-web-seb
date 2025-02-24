import axios from 'axios';
import mongoose from 'mongoose';
import { University } from '../models/University';

interface CollegeScorecardResponse {
  metadata: {
    total: number;
    page: number;
    per_page: number;
  };
  results: Array<{
    id: number;
    'school.name': string;
    'school.city': string;
    'school.state': string;
    'school.zip': string;
    'school.school_url': string;
    'latest.student.size': number;
    'latest.school.institutional_characteristics.level': number;
    'latest.school.institutional_characteristics.control': string;
  }>;
}

class CollegeScorecardService {
  private static instance: CollegeScorecardService;
  private apiKey: string;
  private apiUrl: string;
  private cacheTTL: number;

  private constructor() {
    this.apiKey = process.env.COLLEGE_SCORECARD_API_KEY || '';
    this.apiUrl = process.env.COLLEGE_SCORECARD_API_URL || '';
    this.cacheTTL = parseInt(process.env.UNIVERSITY_CACHE_TTL || '86400', 10);

    if (!this.apiKey || !this.apiUrl) {
      throw new Error('College Scorecard API configuration is missing');
    }
  }

  public static getInstance(): CollegeScorecardService {
    if (!CollegeScorecardService.instance) {
      CollegeScorecardService.instance = new CollegeScorecardService();
    }
    return CollegeScorecardService.instance;
  }

  private getControlType(control: string): 'public' | 'private' {
    return control === '1' ? 'public' : 'private';
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.startsWith('www.') ? domain.slice(4) : domain;
    } catch {
      return url;
    }
  }

  private checkDatabaseConnection() {
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. Current state:', mongoose.connection.readyState);
      throw new Error('Database connection not available');
    }
  }

  public async searchUniversities(
    query: string = '',
    page: number = 0,
    perPage: number = 100
  ): Promise<{
    universities: Array<{
      name: string;
      country: string;
      type: 'public' | 'private';
      domain: string;
    }>;
    total: number;
    page: number;
    perPage: number;
  }> {
    try {
      this.checkDatabaseConnection();

      // Try to get data from cache first
      console.log('Attempting to fetch from cache first...');
      const cachedData = await this.getFallbackUniversities(page, perPage, query);
      if (cachedData.universities.length > 0) {
        console.log('Returning cached data:', cachedData.universities.length, 'universities');
        return cachedData;
      }

      console.log('Cache miss, fetching from College Scorecard API...');

      // Build search parameters
      const params = new URLSearchParams({
        api_key: this.apiKey,
        _fields: [
          'id',
          'school.name',
          'school.city',
          'school.state',
          'school.zip',
          'school.school_url',
          'latest.student.size',
          'latest.school.institutional_characteristics.level',
          'latest.school.institutional_characteristics.control'
        ].join(','),
        per_page: perPage.toString(),
        page: page.toString(),
      });

      // Add search query if provided
      if (query) {
        params.append('school.name', query);
      }

      // Make API request with timeout
      const url = `${this.apiUrl.replace(/\/+$/, '')}/schools`; // Remove trailing slashes
      console.log('Making API request to:', url);
      
      const response = await axios.get<CollegeScorecardResponse>(
        url,
        { 
          params,
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('API response received:', response.data.results.length, 'universities');

      // Transform the data
      const universities = response.data.results.map(result => ({
        name: result['school.name'],
        country: 'United States', // All results are US institutions
        type: this.getControlType(result['latest.school.institutional_characteristics.control']),
        domain: this.extractDomain(result['school.school_url'] || '')
      }));

      // Cache the results in MongoDB
      await this.cacheUniversities(universities);

      const result = {
        universities,
        total: response.data.metadata.total,
        page: response.data.metadata.page,
        perPage: response.data.metadata.per_page
      };

      console.log('Returning API data:', result.universities.length, 'universities');
      return result;

    } catch (error) {
      console.error('Error in searchUniversities:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.stack) console.error('Stack trace:', error.stack);
      }
      // Always return a valid response, even if empty
      return {
        universities: [],
        total: 0,
        page,
        perPage
      };
    }
  }

  private async cacheUniversities(universities: Array<{
    name: string;
    country: string;
    type: 'public' | 'private';
    domain: string;
  }>): Promise<void> {
    try {
      this.checkDatabaseConnection();

      console.log('Caching', universities.length, 'universities');

      // Use bulk operations for better performance
      const operations = universities.map(uni => ({
        updateOne: {
          filter: { name: uni.name },
          update: { $set: { ...uni, updatedAt: new Date() } },
          upsert: true
        }
      }));

      const result = await University.bulkWrite(operations);
      console.log('Cache operation result:', {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      });

    } catch (error) {
      console.error('Error caching universities:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.stack) console.error('Stack trace:', error.stack);
      }
    }
  }

  private async getFallbackUniversities(page: number = 0, perPage: number = 100, query: string = '') {
    try {
      this.checkDatabaseConnection();

      let filter = {};
      if (query) {
        filter = {
          name: { $regex: query, $options: 'i' }
        };
      }

      console.log('Querying cache with filter:', filter);
      
      const total = await University.countDocuments(filter);
      console.log('Found total documents in cache:', total);

      const universities = await University.find(filter)
        .sort({ name: 1 })
        .skip(page * perPage)
        .limit(perPage)
        .lean();
      
      console.log('Retrieved from cache:', universities.length, 'universities');

      return {
        universities,
        total,
        page,
        perPage
      };
    } catch (error) {
      console.error('Error fetching cached universities:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.stack) console.error('Stack trace:', error.stack);
      }
      // Return empty result instead of throwing
      return {
        universities: [],
        total: 0,
        page,
        perPage
      };
    }
  }

  public async refreshCache(): Promise<void> {
    try {
      this.checkDatabaseConnection();

      console.log('Starting cache refresh...');

      // Remove universities that haven't been updated within the TTL
      const cutoff = new Date(Date.now() - this.cacheTTL * 1000);
      const deleteResult = await University.deleteMany({
        updatedAt: { $lt: cutoff }
      });
      console.log('Deleted expired cache entries:', deleteResult.deletedCount);

      // Fetch fresh data for the first 1000 universities (10 pages of 100)
      for (let page = 0; page < 10; page++) {
        console.log('Fetching page', page, 'of universities');
        await this.searchUniversities('', page, 100);
      }

      console.log('Cache refresh complete');
    } catch (error) {
      console.error('Error refreshing university cache:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.stack) console.error('Stack trace:', error.stack);
      }
    }
  }
}

export default CollegeScorecardService;
