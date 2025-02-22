const isDevelopment = process.env.NODE_ENV === 'development';

// Log environment variables for debugging
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 'configured' : 'not configured',
  REACT_APP_STRIPE_OFFICIAL_TEST_PRICE_ID: process.env.REACT_APP_STRIPE_OFFICIAL_TEST_PRICE_ID ? 'configured' : 'not configured',
  REACT_APP_STRIPE_BASIC_SUBSCRIPTION_PRICE_ID: process.env.REACT_APP_STRIPE_BASIC_SUBSCRIPTION_PRICE_ID ? 'configured' : 'not configured',
  REACT_APP_STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID: process.env.REACT_APP_STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID ? 'configured' : 'not configured'
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

const getStripePrices = () => {
  // Get price IDs from environment
  const prices = {
    officialTest: process.env.REACT_APP_STRIPE_OFFICIAL_TEST_PRICE_ID,
    basicSubscription: process.env.REACT_APP_STRIPE_BASIC_SUBSCRIPTION_PRICE_ID,
    premiumSubscription: process.env.REACT_APP_STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID
  };

  // Validate price IDs
  const missingPrices = Object.entries(prices).filter(([_, value]) => !value);
  if (missingPrices.length > 0) {
    console.error('Missing Stripe price IDs:', {
      missing: missingPrices.map(([key]) => key),
      prices,
      timestamp: new Date().toISOString()
    });
    throw new Error('Stripe price IDs not properly configured');
  }

  // Log price configuration
  console.log('Stripe price configuration:', {
    officialTest: {
      configured: true,
      value: prices.officialTest,
      matches: prices.officialTest === process.env.REACT_APP_STRIPE_OFFICIAL_TEST_PRICE_ID
    },
    basicSubscription: {
      configured: true,
      value: prices.basicSubscription,
      matches: prices.basicSubscription === process.env.REACT_APP_STRIPE_BASIC_SUBSCRIPTION_PRICE_ID
    },
    premiumSubscription: {
      configured: true,
      value: prices.premiumSubscription,
      matches: prices.premiumSubscription === process.env.REACT_APP_STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID
    },
    timestamp: new Date().toISOString()
  });

  return prices;
};

const config = {
  apiUrl: getApiUrl(),
  stripe: {
    publicKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
    prices: getStripePrices()
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
    publicKey: config.stripe.publicKey ? 'configured' : 'not configured',
    prices: {
      officialTest: config.stripe.prices.officialTest ? 'configured' : 'not configured',
      basicSubscription: config.stripe.prices.basicSubscription ? 'configured' : 'not configured',
      premiumSubscription: config.stripe.prices.premiumSubscription ? 'configured' : 'not configured'
    }
  }
});

export default config;
