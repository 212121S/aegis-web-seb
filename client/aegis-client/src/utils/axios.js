import axios from 'axios';
import config from '../config';

const instance = axios.create({
  baseURL: config.apiUrl,
  timeout: 45000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request Config:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors or server errors for payment verification
    if (!error.response || (error.response.status === 500 && originalRequest.url.includes('/api/payment/verify-session'))) {
      const isPaymentVerification = originalRequest.url.includes('/api/payment/verify-session');
      console.error(isPaymentVerification ? 'Payment verification error:' : 'Network error:', error);
      
      // For payment verification, include additional context
      return Promise.reject({
        message: isPaymentVerification ? 'Payment verification temporarily unavailable' : 'Network Error',
        data: error.response?.data,
        status: error.response?.status,
        headers: originalRequest?.headers,
        method: originalRequest?.method,
        url: originalRequest?.url,
        isPaymentVerification
      });
    }

    // Handle unauthorized errors (but skip for payment verification)
    if (error.response.status === 401 && !originalRequest.url.includes('/api/payment/verify-session')) {
      console.error('Unauthorized error:', {
        url: originalRequest.url,
        error: error.response.data
      });
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject({
        message: 'Authentication expired',
        ...error.response
      });
    }

    // Handle CORS errors
    if (error.response.status === 403 && error.response.data?.message?.includes('CORS')) {
      console.error('CORS Error:', {
        origin: window.location.origin,
        apiUrl: config.apiUrl,
        error: error.response.data
      });
      return Promise.reject({
        message: 'Access denied - CORS error',
        ...error.response
      });
    }

    // Log all errors with enhanced context
    console.error('API Error:', {
      url: originalRequest.url,
      method: originalRequest.method,
      status: error.response?.status,
      data: error.response?.data,
      isPaymentEndpoint: originalRequest.url.includes('/api/payment'),
      isAuthEndpoint: originalRequest.url.includes('/api/auth')
    });

    // Handle other errors with improved context
    const errorResponse = {
      message: error.response?.data?.error || error.message,
      ...error.response,
      endpoint: {
        type: originalRequest.url.includes('/api/payment') ? 'payment' :
              originalRequest.url.includes('/api/auth') ? 'auth' : 'other',
        path: originalRequest.url
      }
    };

    return Promise.reject(errorResponse);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => instance.post('/api/auth/login', credentials),
  register: (userData) => instance.post('/api/auth/register', userData),
  verifyToken: () => instance.post('/api/auth/verify-token'),
  getProfile: () => instance.get('/api/auth/profile'),
  updateProfile: (data) => instance.put('/api/auth/profile', data),
  getVerification: () => instance.get('/api/auth/verification'),
  regenerateToken: () => instance.post('/api/auth/regenerate-token'),
  addTestResult: (data) => instance.post('/api/auth/test-result', data)
};

// Exam API endpoints
export const examAPI = {
  getPracticeQuestions: () => instance.get('/api/exam/practice'),
  getOfficialQuestions: () => instance.get('/api/exam/official'),
  submitPracticeTest: (answers) => instance.post('/api/exam/practice/submit', answers),
  submitOfficialTest: (answers) => instance.post('/api/exam/official/submit', answers),
  getTestHistory: () => instance.get('/api/exam/history'),
  getTestResults: () => instance.get('/api/exam/results')
};

// Payment API endpoints
export const paymentAPI = {
  createCheckoutSession: () => instance.post('/api/payment/create-checkout-session'),
  getSubscriptionStatus: () => instance.get('/api/payment/subscription-status'),
  cancelSubscription: () => instance.post('/api/payment/cancel-subscription'),
  verifySession: (sessionId) => instance.get(`/api/payment/verify-session/${sessionId}`),
  validateCoupon: (code) => instance.get(`/api/payment/validate-coupon/${code}`)
};

export default instance;
