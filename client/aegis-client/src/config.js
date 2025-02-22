const isDevelopment = process.env.NODE_ENV === 'development';

// Log environment variables for debugging
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'configured' : 'not configured'
});

const getApiUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  if (!apiUrl) {
    console.error('API URL not configured!');
    return isDevelopment ? 'http://localhost:10001' : 'https://aegis-web-seb.onrender.com';
  }
  console.log('Using API URL:', apiUrl);
  return apiUrl;
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
