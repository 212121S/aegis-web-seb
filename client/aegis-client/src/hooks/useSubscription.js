import { useState, useEffect, useCallback } from 'react';
import { paymentAPI } from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, verifyAuth } = useAuth();

  const checkSubscription = useCallback(async (retryCount = 0) => {
    try {
      if (!isAuthenticated) {
        console.log('Not authenticated, skipping subscription check');
        setLoading(false);
        return null;
      }

      console.log('Initiating subscription status check...', {
        attempt: retryCount + 1,
        isAuthenticated
      });
      const response = await paymentAPI.getSubscriptionStatus();
      console.log('Raw subscription status response:', response);
      
      // Ensure we have a valid response with the expected structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid subscription response format');
      }

      // Extract and validate subscription data
      const subscriptionData = {
        active: response.active === true, // Ensure boolean
        plan: response.plan || null,
        endDate: response.endDate || null,
        details: {
          stripeCustomerId: response.details?.stripeCustomerId || null,
          stripeSubscriptionId: response.details?.stripeSubscriptionId || null,
          stripeStatus: response.details?.stripeStatus || null
        }
      };

      console.log('Processed subscription data:', subscriptionData);
      
      // Only update state if the subscription status has changed
      setSubscription(prevState => {
        const hasChanged = !prevState || 
          prevState.active !== subscriptionData.active ||
          prevState.plan !== subscriptionData.plan;
        
        if (hasChanged) {
          console.log('Subscription state updated:', subscriptionData);
          return subscriptionData;
        }
        return prevState;
      });
      
      setLoading(false);
      setError(null);
      return subscriptionData;
    } catch (err) {
      console.error('Subscription check error:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        attempt: retryCount + 1
      });

      // Handle 401 errors by verifying auth
      if (err.response?.status === 401 && retryCount < 1) {
        console.log('Unauthorized error, verifying auth and retrying...');
        const isValid = await verifyAuth();
        if (isValid) {
          return checkSubscription(retryCount + 1);
        }
      }

      let errorMessage = 'Failed to check subscription status';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message === 'Invalid subscription response format') {
        errorMessage = 'Invalid response from subscription service';
      } else if (!err.response && err.message) {
        errorMessage = 'Network error: Unable to reach subscription service';
      }

      setSubscription(null);
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [isAuthenticated, verifyAuth]);

  useEffect(() => {
    const initializeSubscription = async () => {
      try {
        if (!isAuthenticated) {
          console.log('Not authenticated, clearing subscription state');
          setSubscription(null);
          setLoading(false);
          return;
        }

        // Verify auth token before checking subscription
        const isValid = await verifyAuth();
        if (!isValid) {
          console.warn('Auth token invalid, clearing subscription state');
          setSubscription(null);
          setLoading(false);
          return;
        }

        console.log('Auth verified, checking subscription');
        await checkSubscription();
      } catch (err) {
        console.error('Subscription initialization error:', err);
        setError('Failed to initialize subscription status');
        setLoading(false);
      }
    };

    initializeSubscription();

    // Set up periodic subscription check if authenticated
    if (isAuthenticated) {
      const intervalId = setInterval(async () => {
        const isValid = await verifyAuth();
        if (isValid) {
          await checkSubscription();
        }
      }, 60000);
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, verifyAuth, checkSubscription]);

  // Log subscription state changes
  useEffect(() => {
    console.log('Subscription state updated:', {
      subscription,
      isActive: subscription?.active,
      plan: subscription?.planId,
      loading,
      error
    });
  }, [subscription, loading, error]);

  const handleSubscriptionRequired = () => {
    navigate('/pricing', { 
      state: { 
        from: window.location.pathname,
        message: 'An active subscription is required to access this feature'
      }
    });
  };

  const isSubscriptionActive = () => {
    // Ensure we have a valid subscription state
    if (!subscription || typeof subscription.active !== 'boolean') {
      console.warn('Invalid subscription state in isSubscriptionActive check:', subscription);
      return false;
    }
    
    console.log('Checking subscription active:', { 
      subscription, 
      active: subscription.active,
      plan: subscription.plan,
      stripeStatus: subscription.details?.stripeStatus 
    });
    
    return subscription.active === true;
  };

  const getSubscriptionEndDate = () => {
    return subscription?.endDate ? new Date(subscription.endDate) : null;
  };

  const getSubscriptionPlan = () => {
    return subscription?.planId || null;
  };

  return {
    loading,
    error,
    subscription,
    isSubscriptionActive,
    getSubscriptionEndDate,
    getSubscriptionPlan,
    handleSubscriptionRequired,
    refreshSubscription: checkSubscription
  };
};
