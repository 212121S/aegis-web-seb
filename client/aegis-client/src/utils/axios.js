import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
});

// Add auth token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Exam API endpoints
export const examAPI = {
  initialize: async (type) => {
    const browserInfo = {
      name: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
            navigator.userAgent.includes('Firefox') ? 'Firefox' : 
            navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
      version: navigator.appVersion,
      os: navigator.platform
    };
    
    const response = await instance.post('/exam/initialize', { type, browserInfo });
    return response.data;
  },

  getNextQuestion: async (sessionId) => {
    const response = await instance.get(`/exam/${sessionId}/next`);
    return response.data;
  },

  submitAnswer: async (sessionId, data) => {
    const response = await instance.post(`/exam/${sessionId}/answer`, data);
    return response.data;
  },

  submitProctoringEvent: async (sessionId, event) => {
    const response = await instance.post(`/exam/${sessionId}/proctoring-event`, event);
    return response.data;
  },

  finalizeTest: async (sessionId) => {
    const response = await instance.post(`/exam/${sessionId}/finalize`);
    return response.data;
  }
};

// Auth API endpoints
export const authAPI = {
  login: async (credentials) => {
    const response = await instance.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await instance.post('/auth/register', userData);
    return response.data;
  },

  verifyToken: async () => {
    const response = await instance.get('/auth/verify');
    return response.data;
  }
};

// Payment API endpoints
export const paymentAPI = {
  createSession: async (productId) => {
    const response = await instance.post('/payment/create-session', { productId });
    return response.data;
  },

  verifyPayment: async (sessionId) => {
    const response = await instance.post('/payment/verify', { sessionId });
    return response.data;
  }
};

export default instance;
