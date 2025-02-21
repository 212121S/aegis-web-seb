import axios from 'axios';
import config from '../config';

const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Handle all responses between 200-499
  }
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Log request details
    console.log('[Request]', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });

    // Add any auth tokens or additional headers here
    return config;
  },
  (error) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('[Response]', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Log error details
    console.error('[Response Error]', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });

    // Handle specific error types
    if (error.code === "ERR_NETWORK") {
      console.error('[Network Error] Failed to connect to server');
    } else if (error.response?.status === 403) {
      console.error('[CORS Error] Request blocked by CORS policy');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
