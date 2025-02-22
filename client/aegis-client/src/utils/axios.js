import axios from 'axios';
import config from '../config';

const instance = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Custom error classes
class PaymentVerificationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'PaymentVerificationError';
    this.details = details;
  }
}

class SubscriptionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SubscriptionError';
    this.details = details;
  }
}

// Add request interceptor
instance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Configure payment and subscription endpoints
    if (config.url?.includes('/payment/') || config.url?.includes('/stripe/')) {
      config.isPaymentEndpoint = true;
      
      // Set shorter timeout for verification endpoints
      if (config.url?.includes('verify-session')) {
        config.timeout = 10000; // 10 seconds for verification requests
      }
    }

    if (config.url?.includes('/subscription/')) {
      config.isSubscriptionEndpoint = true;
      config.timeout = 15000; // 15 seconds for subscription requests
    }
    
    // Add request timestamp and metadata for tracking
    config.metadata = {
      timestamp: new Date().toISOString(),
      endpoint: config.url,
      type: config.isPaymentEndpoint ? 'payment' : 
            config.isSubscriptionEndpoint ? 'subscription' : 'general'
    };
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', {
      error,
      timestamp: new Date().toISOString()
    });
    return Promise.reject(error);
  }
);

// Add response interceptor
instance.interceptors.response.use(
  (response) => {
    // Log successful payment/subscription responses
    if (response.config?.isPaymentEndpoint || response.config?.isSubscriptionEndpoint) {
      console.log(`${response.config.metadata.type} endpoint response:`, {
        url: response.config.url,
        status: response.status,
        timestamp: new Date().toISOString(),
        requestTimestamp: response.config.metadata?.timestamp,
        type: response.config.metadata.type
      });
    }
    
    // Special handling for auth endpoints to maintain expected response structure
    if (response.config.url?.startsWith('/auth/')) {
      return response.data;
    }
    
    // For non-auth endpoints, return just the data
    return response.data;
  },
  async (error) => {
    // Extract useful error info
    const errorData = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      isPaymentEndpoint: error.config?.isPaymentEndpoint,
      isSubscriptionEndpoint: error.config?.isSubscriptionEndpoint,
      requestTimestamp: error.config?.metadata?.timestamp,
      responseTimestamp: new Date().toISOString(),
      type: error.config?.metadata?.type
    };

    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      if (error.config?.isPaymentEndpoint) {
        errorData.message = 'Payment verification request timed out. Please check your account page for status.';
      } else if (error.config?.isSubscriptionEndpoint) {
        errorData.message = 'Subscription check timed out. Please refresh to try again.';
      } else {
        errorData.message = 'Request timed out. Please try again.';
      }
    } else if (!error.response) {
      errorData.message = 'Network error. Please check your connection.';
    } else if (error.response.status === 500) {
      if (error.config?.isPaymentEndpoint) {
        if (error.response.data?.error?.includes('webhook')) {
          errorData.message = 'Payment webhook processing delayed. Please wait a moment.';
        } else {
          errorData.message = 'Payment verification temporarily unavailable';
        }
      } else if (error.config?.isSubscriptionEndpoint) {
        errorData.message = 'Subscription service temporarily unavailable';
      } else {
        errorData.message = 'An unexpected error occurred. Please try again.';
      }
    } else if (error.response.status === 401) {
      errorData.message = 'Authentication failed. Please log in again.';
    } else if (error.response.status === 404) {
      if (error.config?.isPaymentEndpoint) {
        errorData.message = 'Payment session not found. Please try the payment process again.';
      } else if (error.config?.isSubscriptionEndpoint) {
        errorData.message = 'Subscription information not found';
      }
    }

    // Enhanced error logging
    console.error('API Error:', {
      ...errorData,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        timeout: error.config?.timeout,
      },
      duration: errorData.responseTimestamp && errorData.requestTimestamp
        ? new Date(errorData.responseTimestamp) - new Date(errorData.requestTimestamp)
        : null
    });

    // Transform specific endpoint errors
    if (error.config?.isPaymentEndpoint && error.config.url?.includes('verify-session')) {
      throw new PaymentVerificationError(errorData.message, errorData);
    } else if (error.config?.isSubscriptionEndpoint) {
      throw new SubscriptionError(errorData.message, errorData);
    }

    return Promise.reject(errorData);
  }
);

export const paymentAPI = {
  verifySession: async (sessionId, attempt = 1, maxAttempts = 5, onRetry = null) => {
    if (!sessionId) {
      throw new PaymentVerificationError('Session ID is required');
    }

    try {
      console.log('Initiating payment verification:', {
        sessionId,
        attempt,
        maxAttempts,
        timestamp: new Date().toISOString()
      });

      const response = await instance.get(`/payment/verify-session/${sessionId}`);
      
      console.log('Payment verification successful:', {
        sessionId,
        response,
        attempt,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      // Add verification attempt details to error
      if (error instanceof PaymentVerificationError) {
        error.details = {
          ...error.details,
          sessionId,
          attempt,
          maxAttempts
        };
      }
      
      console.error('Payment verification error:', {
        error,
        sessionId,
        attempt,
        maxAttempts,
        timestamp: new Date().toISOString()
      });
      
      // Determine if retry is needed
      const shouldRetry = attempt < maxAttempts && (
        error.response?.status === 500 ||
        error.code === 'ECONNABORTED' ||
        !error.response
      );

      if (shouldRetry) {
        const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Call progress callback if provided
        if (onRetry && typeof onRetry === 'function') {
          onRetry(attempt + 1);
        }
        
        return paymentAPI.verifySession(sessionId, attempt + 1, maxAttempts, onRetry);
      }
      
      throw error;
    }
  },
  
  createSession: async (priceId) => {
    if (!priceId) {
      throw new Error('Price ID is required');
    }

    try {
      console.log('Creating payment session:', {
        priceId,
        timestamp: new Date().toISOString()
      });

      const response = await instance.post('/payment/create-checkout-session', { priceId });
      
      console.log('Payment session created:', {
        priceId,
        sessionId: response.sessionId,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('Session creation error:', {
        error,
        priceId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
};

export const subscriptionAPI = {
  getSubscriptionStatus: async () => {
    try {
      console.log('Fetching subscription status:', {
        timestamp: new Date().toISOString()
      });

      const response = await instance.get('/subscription/status');
      
      console.log('Subscription status retrieved:', {
        status: response.active,
        plan: response.plan,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('Subscription status error:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
};

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await instance.post('/auth/login', credentials);
      return response;
    } catch (error) {
      console.error('Login error:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },
  
  verifyToken: async () => {
    try {
      const response = await instance.post('/auth/verify-token');
      return response;
    } catch (error) {
      // Don't throw error during payment flow
      if (window.location.pathname.includes('/payment/success')) {
        console.warn('Skipping auth error during payment flow:', {
          error,
          timestamp: new Date().toISOString()
        });
        return { valid: true };
      }
      
      console.error('Token verification error:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await instance.get('/auth/profile');
      return response;
    } catch (error) {
      console.error('Get profile error:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
};

export const examAPI = {
  getPracticeQuestions: async () => {
    try {
      const response = await instance.get('/exam/practice');
      return response;
    } catch (error) {
      console.error('Failed to get practice questions:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  getHistory: async () => {
    try {
      const response = await instance.get('/exam/history');
      return response;
    } catch (error) {
      console.error('Failed to get test history:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  submitPracticeTest: async (data) => {
    try {
      const response = await instance.post('/exam/submit-practice', data);
      return response;
    } catch (error) {
      console.error('Failed to submit practice test:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  initialize: async (type) => {
    try {
      const response = await instance.post('/exam/initialize', { type });
      return response;
    } catch (error) {
      console.error('Failed to initialize test:', {
        error,
        type,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  getNextQuestion: async (sessionId) => {
    try {
      const response = await instance.get(`/exam/question/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Failed to get next question:', {
        error,
        sessionId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  submitAnswer: async (sessionId, data) => {
    try {
      const response = await instance.post(`/exam/answer/${sessionId}`, data);
      return response;
    } catch (error) {
      console.error('Failed to submit answer:', {
        error,
        sessionId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  finalizeTest: async (sessionId) => {
    try {
      const response = await instance.post(`/exam/finalize/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Failed to finalize test:', {
        error,
        sessionId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  getTestResults: async (testId) => {
    try {
      const response = await instance.get(`/exam/results/${testId}`);
      return response;
    } catch (error) {
      console.error('Failed to get test results:', {
        error,
        testId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
};

export default instance;
