const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  apiUrl: isDevelopment 
    ? 'http://localhost:10000'
    : process.env.REACT_APP_API_URL || 'https://aegis-api.onrender.com',
  stripe: {
    publicKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || process.env.REACT_APP_STRIPE_PUBLIC_KEY
  },
  environment: process.env.NODE_ENV || 'development',
  features: {
    subscriptions: true,
    verification: true,
    proctoring: true
  }
};

// Log configuration in development
if (isDevelopment) {
  console.log('App Configuration:', {
    apiUrl: config.apiUrl,
    environment: config.environment,
    features: config.features,
    stripe: {
      publicKey: config.stripe.publicKey ? 'configured' : 'not configured'
    }
  });
}

export default config;
