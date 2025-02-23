import { useState, useEffect, useCallback } from 'react';
import { subscriptionAPI } from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, verifyAuth } = useAuth();

  const checkSubscription = useCallback(async (retryCount = 0, maxRetries = 5) => {
    try {
      if (!isAuthenticated) {
        console.log('Not authenticated, skipping subscription check');
        setLoading(false);
        return null;
      }

      console.log('Initiating subscription status check...', {
        attempt: retryCount + 1,
        maxRetries,
        isAuthenticated
      });

      const response = await subscriptionAPI.getSubscriptionStatus().catch(async (err) => {
        // Handle specific error cases that warrant retries
        const isServerError = err.response?.status === 500;
        const isAuthError = err.response?.status === 401;
        const isTimeout = err.message?.includes('timeout') || err.code === 'ECONNABORTED';
        const isNetworkError = !err.response && !err.status;
        
        if ((isServerError || isAuthError || isTimeout || isNetworkError) && retryCount < maxRetries) {
          console.log('Retriable error encountered, verifying auth and retrying...', {
            error: err,
            type: isServerError ? 'server' : 
                  isAuthError ? 'auth' :
                  isTimeout ? 'timeout' : 'network',
            attempt: retryCount + 1
          });

          if (isAuthError) {
            const isValid = await verifyAuth();
            if (!isValid) {
              throw err;
            }
          }

          // Exponential backoff with jitter
          const baseDelay = Math.min(2000 * Math.pow(1.5, retryCount), 8000);
          const jitter = Math.random() * Math.min(1000, baseDelay * 0.1);
          const delay = Math.round(baseDelay + jitter);

          await new Promise(resolve => setTimeout(resolve, delay));
          return checkSubscription(retryCount + 1, maxRetries);
        }
        throw err;
      });

      console.log('Raw subscription status response:', response);
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid subscription response format');
      }

      // Extract subscription data with detailed logging
      const subscriptionData = {
        active: response.active,
        plan: response.plan || null,
        endDate: response.currentPeriodEnd || null
      };

      // Log the subscription data
      console.log('Processed subscription data:', subscriptionData);

      console.log('Processed subscription data:', {
        ...subscriptionData,
        validationPassed: true
      });
      
      // Update state only if there are meaningful changes
      setSubscription(prevState => {
        const hasChanged = !prevState || 
          prevState.active !== subscriptionData.active ||
          prevState.plan !== subscriptionData.plan ||
          prevState.endDate !== subscriptionData.endDate;
        
        if (hasChanged) {
          console.log('Subscription state updated:', {
            previous: prevState,
            new: subscriptionData,
            changes: {
              activeChanged: prevState?.active !== subscriptionData.active,
              planChanged: prevState?.plan !== subscriptionData.plan,
              endDateChanged: prevState?.endDate !== subscriptionData.endDate
            }
          });
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
        attempt: retryCount + 1,
        maxRetries
      });

      let errorMessage;
      if (err.response?.status === 401) {
        errorMessage = 'Authentication required to check subscription';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied to subscription service';
      } else if (err.response?.status === 500) {
        errorMessage = 'Subscription service temporarily unavailable';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message?.includes('Invalid subscription')) {
        errorMessage = 'Unable to verify subscription status';
      } else if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
        errorMessage = 'Subscription check timed out. Please try again.';
      } else if (!err.response && err.message) {
        errorMessage = 'Network error: Unable to reach subscription service';
      } else {
        errorMessage = 'Failed to check subscription status';
      }

      // Only clear subscription state for non-transient errors
      if (!err.response?.status || ![500, 408].includes(err.response?.status)) {
        setSubscription(null);
      }
      
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [isAuthenticated, verifyAuth]);

  useEffect(() => {
    let mounted = true;
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
        if (mounted) {
          await checkSubscription();
        }
      } catch (err) {
        console.error('Subscription initialization error:', {
          error: err,
          message: err.message,
          status: err.response?.status
        });
        if (mounted) {
          setError('Failed to initialize subscription status');
          setLoading(false);
        }
      }
    };

    initializeSubscription();

    // Set up periodic subscription check if authenticated
    let intervalId;
    if (isAuthenticated) {
      intervalId = setInterval(async () => {
        const isValid = await verifyAuth();
        if (isValid && mounted) {
          await checkSubscription();
        }
      }, 60000); // Check every minute
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, verifyAuth, checkSubscription]);

  // Log subscription state changes
  useEffect(() => {
    console.log('Subscription state updated:', {
      subscription,
      isActive: subscription?.active,
      plan: subscription?.plan,
      endDate: subscription?.endDate,
      loading,
      error,
      timestamp: new Date().toISOString()
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
      console.warn('Invalid subscription state in isSubscriptionActive check:', {
        subscription,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    console.log('Checking subscription active:', { 
      subscription, 
      active: subscription.active,
      plan: subscription.plan,
      endDate: subscription.endDate,
      timestamp: new Date().toISOString()
    });
    
    return subscription.active;
  };

  const getSubscriptionEndDate = () => {
    return subscription?.endDate ? new Date(subscription.endDate) : null;
  };

  const getSubscriptionPlan = () => {
    return subscription?.plan || null;
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
