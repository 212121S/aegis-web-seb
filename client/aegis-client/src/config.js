const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  stripe: {
    publicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_51OqLBXLxBGcNBXtPKGcNrF8RKgEGC9kYwvVvqVVWXYZaAbBcDdEeFfGgHhIjJkLmNoPpQqRsTuVwXyYzZaAbBcD'
  }
};

export default config;
