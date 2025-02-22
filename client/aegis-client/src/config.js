const isDevelopment = process.env.NODE_ENV === 'development';

// Log environment variables for debugging
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'configured' : 'not configured'
});

const getApiUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  let baseUrl;
  if (!apiUrl) {
    console.error('API URL not configured!');
    baseUrl = isDevelopment ? 'http://localhost:3005' : 'https://aegis-web-seb.onrender.com';
  } else {
    baseUrl = apiUrl;
  }
  // Ensure the URL ends with /api
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const config = {
  apiUrl: getApiUrl(),
  stripe: {
    publicKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  },
  environment: process.env.NODE_ENV || 'development',
  features: {
    subscriptions: true,
    verification: true,
    proctoring: true
  }
};

// Log final configuration
console.log('App Configuration:', {
  apiUrl: config.apiUrl,
  environment: config.environment,
  features: config.features,
  stripe: {
    publicKey: config.stripe.publicKey ? 'configured' : 'not configured'
  }
});

export default config;
