import axios from 'axios';

// Get the base URL from environment or default
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const instance = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', baseURL);
}

// Add auth token and handle requests
instance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('Response Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
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
    const response = await instance.get('/api/payment/subscription-status');
    return response.data;
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
