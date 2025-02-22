import axios from 'axios';

// Get the base URL from environment or default
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

// Log the actual base URL being used
console.log('API Configuration:', {
  baseURL,
  environment: process.env.NODE_ENV,
  apiUrl: process.env.REACT_APP_API_URL
});

const instance = axios.create({
  baseURL,
  timeout: 45000, // 45 second timeout to account for database operations
  withCredentials: true, // Enable credentials for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Enhanced request logging
console.log('Axios Instance Configuration:', {
  baseURL,
  timeout: instance.defaults.timeout,
  withCredentials: instance.defaults.withCredentials,
  headers: instance.defaults.headers
});

// Add auth token and handle requests
instance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    
    // Enhanced token logging
    console.log('Token check in request interceptor:', {
      hasToken: !!token,
      url: config.url,
      method: config.method
    });

    if (token) {
      // Ensure token is properly formatted
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
      
      // Log headers for debugging
      console.log('Request headers:', {
        Authorization: config.headers.Authorization,
        ContentType: config.headers['Content-Type']
      });
    } else {
      console.warn('No auth token found for request:', config.url);
    }

    // Log full request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Full request details:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
        baseURL: config.baseURL
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response handling
instance.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Response received:', {
        url: response.config.url,
        status: response.status,
        headers: response.headers,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers,
      message: error.message
    });

    if (error.response?.status === 401) {
      console.warn('Authentication error - clearing token');
      localStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

// Exam API endpoints
export const examAPI = {
  initialize: async (type) => {
    const response = await instance.post('/api/exam/initialize', { type });
    return response.data;
  },

  getNextQuestion: async (sessionId) => {
    const response = await instance.get(`/api/exam/${sessionId}/next-question`);
    return response.data;
  },

  submitAnswer: async (sessionId, data) => {
    const response = await instance.post(`/api/exam/${sessionId}/submit`, data);
    return response.data;
  },

  submitProctoringEvent: async (sessionId, event) => {
    const response = await instance.post(`/api/exam/${sessionId}/proctoring`, event);
    return response.data;
  },

  finalizeTest: async (sessionId) => {
    const response = await instance.post(`/api/exam/${sessionId}/finalize`);
    return response.data;
  },

  getHistory: async () => {
    const response = await instance.get('/api/exam/history');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await instance.get('/api/exam/analytics');
    return response.data;
  },

  getResults: async (testId) => {
    const response = await instance.get(`/api/exam/results/${testId}`);
    return response.data;
  }
};

// Auth API endpoints
export const authAPI = {
  login: async (credentials) => {
    const response = await instance.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await instance.post('/api/auth/register', userData);
    return response.data;
  },

  verifyToken: async () => {
    const response = await instance.get('/api/auth/verify');
    return response.data;
  },

  getProfile: async () => {
    try {
      const response = await instance.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Profile Error:', error.response || error);
      throw error;
    }
  },

  updateProfile: async (data) => {
    const response = await instance.put('/api/auth/profile', data);
    return response.data;
  }
};

// Payment API endpoints
export const paymentAPI = {
  createCheckoutSession: async (planId, couponCode) => {
    const response = await instance.post('/api/payment/create-checkout-session', { planId, couponCode });
    return response.data;
  },

  verifySession: async (sessionId) => {
    const response = await instance.post('/api/payment/verify-session', { sessionId });
    return response.data;
  },

  getSubscriptionStatus: async () => {
    try {
      const response = await instance.get('/api/payment/subscription-status');
      
      // Log the raw response for debugging
      console.log('Raw subscription API response:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });

      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from subscription endpoint');
      }

      // Ensure the response has the expected structure
      const subscriptionData = {
        active: response.data.active === true,
        plan: response.data.plan || null,
        endDate: response.data.endDate || null,
        details: {
          stripeCustomerId: response.data.details?.stripeCustomerId || null,
          stripeSubscriptionId: response.data.details?.stripeSubscriptionId || null,
          stripeStatus: response.data.details?.stripeStatus || null
        }
      };

      return subscriptionData;
    } catch (error) {
      console.error('Subscription API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  validateCoupon: async (code) => {
    const response = await instance.post('/api/payment/validate-coupon', { code });
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await instance.post('/api/payment/cancel-subscription');
    return response.data;
  }
};

export default instance;
