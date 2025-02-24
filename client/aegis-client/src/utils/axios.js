import axios from 'axios';
import config from '../config';

// Log the API URL for debugging
console.log('Creating axios instance with baseURL:', config.apiUrl);

const instance = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000, // Default timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log all requests for debugging
instance.interceptors.request.use(request => {
  console.log('Request:', {
    url: request.url,
    baseURL: request.baseURL,
    method: request.method,
    timestamp: new Date().toISOString()
  });
  return request;
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
    if (config.url?.includes('payment/') || config.url?.includes('stripe/')) {
      config.isPaymentEndpoint = true;
      
      // Set shorter timeout for verification endpoints
      if (config.url?.includes('verify-session')) {
        config.timeout = 15000; // 15 seconds for verification requests
      }

      // Log payment request details
      console.log('Payment request:', {
        url: config.url,
        method: config.method,
        data: config.data,
        token: !!token,
        timestamp: new Date().toISOString()
      });
    }

    if (config.url?.includes('subscription-status')) {
      config.isSubscriptionEndpoint = true;
      config.timeout = 15000; // 15 seconds for subscription requests
    } else if (config.url?.includes('practice/generate')) {
      config.timeout = 120000; // 2 minutes for practice test generation
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
    // Log successful responses for debugging
    
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
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    });

    // Validate response data
    if (!response.data) {
      console.warn('Empty response data:', {
        url: response.config.url,
        status: response.status
      });
      throw new Error('Empty response data');
    }

    // For array responses (like questions), ensure it's an array
    if (response.config.url?.includes('exam/history')) {
      if (!Array.isArray(response.data)) {
        console.error('Invalid array response:', {
          url: response.config.url,
          data: response.data
        });
        throw new Error('Invalid response format: expected an array');
      }
    }

    // Return the full response for debugging
    console.log('Full response:', response);
    return response.data;
  },
  async (error) => {
    const isPaymentFlow = window.location.pathname.includes('payment');
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
      // Skip auth errors during payment flow
      if (isPaymentFlow) {
        console.log('Skipping auth error during payment flow');
        return { data: { valid: true } };
      }
      errorData.message = 'Authentication failed. Please log in again.';
    } else if (error.response.status === 404) {
      if (error.config?.isPaymentEndpoint) {
        errorData.message = 'Payment session not found. Please try the payment process again.';
      } else if (error.config?.isSubscriptionEndpoint) {
        errorData.message = 'Subscription information not found';
      }
    } else if (error.response.status === 202) {
      // Handle processing state
      return error.response.data;
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
    if (error.config?.isPaymentEndpoint) {
      if (error.response?.status === 401) {
        // Skip auth errors during payment flow
        console.log('Skipping auth error during payment flow');
        return Promise.resolve({ data: { valid: true } });
      }
      if (error.config.url?.includes('verify-session')) {
        throw new PaymentVerificationError(errorData.message, errorData);
      }
    } else if (error.config?.isSubscriptionEndpoint) {
      throw new SubscriptionError(errorData.message, errorData);
    }

    return Promise.reject(errorData);
  }
);

export const paymentAPI = {
  verifySession: async (sessionId, attempt = 1, maxAttempts = 15, onRetry = null) => {
    if (!sessionId) {
      throw new PaymentVerificationError('Session ID is required');
    }

    const verifyWithRetry = async (currentAttempt) => {
      try {
        console.log('Initiating payment verification:', {
          sessionId,
          attempt: currentAttempt,
          maxAttempts,
          timestamp: new Date().toISOString()
        });

        // Initial delay to allow webhook processing
        if (currentAttempt === 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const response = await instance.get(`payment/verify-session/${sessionId}`);
        
        // Handle processing status
        if (response.status === 'processing') {
          console.log('Payment verification in progress:', {
            sessionId,
            attempt: currentAttempt,
            message: response.message,
            timestamp: new Date().toISOString()
          });

          if (currentAttempt < maxAttempts) {
            const delay = 3000 * Math.pow(1.5, currentAttempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            return verifyWithRetry(currentAttempt + 1);
          }
          throw new PaymentVerificationError('Payment verification timed out');
        }
        
        console.log('Payment verification successful:', {
          sessionId,
          response,
          attempt: currentAttempt,
          timestamp: new Date().toISOString()
        });

        return response;
      } catch (error) {
        // Add verification attempt details to error
        const enhancedError = error instanceof PaymentVerificationError ? error : new PaymentVerificationError(error.message);
        enhancedError.details = {
          sessionId,
          attempt: currentAttempt,
          maxAttempts,
          status: error.response?.status,
          data: error.response?.data
        };
        
        // Enhanced error logging
        console.error('Payment verification error:', {
          error: enhancedError,
          sessionId,
          attempt: currentAttempt,
          maxAttempts,
          timestamp: new Date().toISOString(),
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Determine if retry is needed
        const shouldRetry = currentAttempt < maxAttempts && (
          error.response?.status === 500 ||
          error.response?.status === 404 || // Session not found yet
          error.response?.status === 202 || // Still processing
          error.code === 'ECONNABORTED' ||
          !error.response ||
          error.response?.data?.error === 'Payment not completed' ||
          error.response?.data?.status === 'processing'
        );

        if (shouldRetry) {
          const baseDelay = 4000; // 4 seconds base delay
          const delay = Math.min(baseDelay * Math.pow(1.5, currentAttempt - 1), 15000);
          
          console.log('Retrying payment verification:', {
            sessionId,
            attempt: currentAttempt,
            nextAttempt: currentAttempt + 1,
            delay,
            timestamp: new Date().toISOString()
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Call progress callback if provided
          if (onRetry && typeof onRetry === 'function') {
            onRetry(currentAttempt + 1);
          }
          
          return verifyWithRetry(currentAttempt + 1);
        }
        
        throw enhancedError;
      }
    };

    return verifyWithRetry(attempt);
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

      const response = await instance.post('payment/create-checkout-session', { priceId });
      
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

      const response = await instance.get('payment/subscription-status');
      
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
      const response = await instance.post('auth/login', credentials);
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
      const response = await instance.post('auth/verify-token');
      return response;
    } catch (error) {
      // Don't throw error during payment flow
      if (window.location.pathname.includes('payment/success')) {
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
      const response = await instance.get('auth/profile');
      return response;
    } catch (error) {
      console.error('Get profile error:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await instance.put('auth/profile', data);
      return response;
    } catch (error) {
      console.error('Update profile error:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
};

export const examAPI = {
  // Generic HTTP methods
  get: async (url) => {
    try {
      const response = await instance.get(url);
      return response;
    } catch (error) {
      console.error(`Failed to GET ${url}:`, {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },
  
  post: async (url, data) => {
    try {
      const response = await instance.post(url, data);
      return response;
    } catch (error) {
      console.error(`Failed to POST to ${url}:`, {
        error,
        data,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },
  
  // Practice Test Builder endpoints
  getPracticeConfig: async () => {
    try {
      const response = await instance.get('practice/configuration');
      return response;
    } catch (error) {
      console.error('Failed to get practice test configuration:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  generatePracticeTest: async (data) => {
    try {
      const response = await instance.post('practice/generate', data);
      return response;
    } catch (error) {
      console.error('Failed to generate practice test:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  submitPracticeTest: async (data) => {
    try {
      const response = await instance.post('practice/submit', data);
      return response;
    } catch (error) {
      console.error('Failed to submit practice test:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  getHistory: async () => {
    try {
      const response = await instance.get('exam/history');
      return response;
    } catch (error) {
      console.error('Failed to get test history:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  initialize: async (type) => {
    try {
      const response = await instance.post('exam/initialize', { type });
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
      const response = await instance.get(`exam/question/${sessionId}`);
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
      const response = await instance.post(`exam/answer/${sessionId}`, data);
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
      const response = await instance.post(`exam/finalize/${sessionId}`);
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
      const response = await instance.get(`exam/results/${testId}`);
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
