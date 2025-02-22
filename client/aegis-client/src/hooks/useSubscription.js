import { useState, useEffect } from 'react';
import { paymentAPI } from '../utils/axios';
import { useNavigate } from 'react-router-dom';

export const useSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token check in useSubscription:', { hasToken: !!token });
    
    if (token) {
      checkSubscription();
      // Set up periodic subscription check every minute
      const intervalId = setInterval(checkSubscription, 60000);
      return () => clearInterval(intervalId);
    } else {
      console.log('No token found, clearing subscription state');
      setSubscription(null);
      setLoading(false);
    }
  }, [localStorage.getItem('token')]);

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

  const checkSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token available for subscription check');
        setLoading(false);
        return null;
      }

      console.log('Initiating subscription status check...');
      const response = await paymentAPI.getSubscriptionStatus();
      console.log('Subscription status response:', response);
      
      const subscriptionData = response.data;
      console.log('Processing subscription data:', {
        active: subscriptionData.active,
        plan: subscriptionData.plan,
        stripeStatus: subscriptionData.details?.stripeStatus
      });
      
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
      console.error('Subscription check error:', err);
      console.error('Error details:', {
        response: err.response?.data,
        status: err.response?.status
      });
      const errorMessage = err.response?.data?.message || 'Failed to check subscription status';
      console.error('Subscription check error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: errorMessage
      });
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  const handleSubscriptionRequired = () => {
    navigate('/pricing', { 
      state: { 
        from: window.location.pathname,
        message: 'An active subscription is required to access this feature'
      }
    });
  };

  const isSubscriptionActive = () => {
    const active = subscription?.active || false;
    console.log('Checking subscription active:', { subscription, active });
    return active;
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
