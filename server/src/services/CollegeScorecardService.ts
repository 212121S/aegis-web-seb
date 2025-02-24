import axios from 'axios';
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

      // Make API request
      const response = await axios.get<CollegeScorecardResponse>(
        `${this.apiUrl}/schools`,
        { params }
      );

      // Transform the data
      const universities = response.data.results.map(result => ({
        name: result['school.name'],
        country: 'United States', // All results are US institutions
        type: this.getControlType(result['latest.school.institutional_characteristics.control']),
        domain: this.extractDomain(result['school.school_url'] || '')
      }));

      // Cache the results in MongoDB
      await this.cacheUniversities(universities);

      return {
        universities,
        total: response.data.metadata.total,
        page: response.data.metadata.page,
        perPage: response.data.metadata.per_page
      };
    } catch (error) {
      console.error('Error fetching universities from College Scorecard:', error);
      // Fallback to cached data
      return this.getFallbackUniversities();
    }
  }

  private async cacheUniversities(universities: Array<{
    name: string;
    country: string;
    type: 'public' | 'private';
    domain: string;
  }>): Promise<void> {
    try {
      // Use bulk operations for better performance
      const operations = universities.map(uni => ({
        updateOne: {
          filter: { name: uni.name },
          update: { $set: { ...uni, updatedAt: new Date() } },
          upsert: true
        }
      }));

      await University.bulkWrite(operations);
    } catch (error) {
      console.error('Error caching universities:', error);
    }
  }

  private async getFallbackUniversities(page: number = 0, perPage: number = 100) {
    try {
      const total = await University.countDocuments();
      const universities = await University.find()
        .skip(page * perPage)
        .limit(perPage)
        .lean();

      return {
        universities,
        total,
        page,
        perPage
      };
    } catch (error) {
      console.error('Error fetching cached universities:', error);
      throw new Error('Unable to fetch universities');
    }
  }

  public async refreshCache(): Promise<void> {
    try {
      // Remove universities that haven't been updated within the TTL
      const cutoff = new Date(Date.now() - this.cacheTTL * 1000);
      await University.deleteMany({
        updatedAt: { $lt: cutoff }
      });

      // Fetch fresh data for the first 1000 universities (10 pages of 100)
      for (let page = 0; page < 10; page++) {
        await this.searchUniversities('', page, 100);
      }
    } catch (error) {
      console.error('Error refreshing university cache:', error);
    }
  }
}

export default CollegeScorecardService;
