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

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        message: 'Network Error',
        data: undefined,
        status: undefined,
        headers: originalRequest?.headers,
        method: originalRequest?.method,
        url: originalRequest?.url
      });
    }

    // Handle unauthorized errors
    if (error.response.status === 401) {
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

    // Log all errors
    console.error('API Error:', {
      url: originalRequest.url,
      method: originalRequest.method,
      status: error.response?.status,
      data: error.response?.data
    });

    // Handle other errors
    return Promise.reject({
      message: error.response?.data?.error || error.message,
      ...error.response
    });
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
