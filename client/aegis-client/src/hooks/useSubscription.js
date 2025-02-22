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
    if (token) {
      checkSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [localStorage.getItem('token')]);

  const checkSubscription = async () => {
    try {
      if (!localStorage.getItem('token')) {
        setLoading(false);
        return null;
      }

      const response = await paymentAPI.getSubscriptionStatus();
      const subscriptionData = response.data;
      
      setSubscription(subscriptionData);
      setLoading(false);
      
      return subscriptionData; // Return the subscription data for the caller
    } catch (err) {
      console.error('Subscription check error:', err);
      setError(err.response?.data?.message || 'Failed to check subscription status');
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
    return subscription?.active || false;
  };

  const getSubscriptionEndDate = () => {
    return subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
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
