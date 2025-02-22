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
      if (!localStorage.getItem('token')) {
        setLoading(false);
        return null;
      }

      console.log('Checking subscription status...');
      const response = await paymentAPI.getSubscriptionStatus();
      console.log('Subscription status response:', response);
      
      const subscriptionData = response.data;
      console.log('Setting subscription data:', subscriptionData);
      
      setSubscription(subscriptionData);
      setLoading(false);
      
      return subscriptionData;
    } catch (err) {
      console.error('Subscription check error:', err);
      console.error('Error details:', {
        response: err.response?.data,
        status: err.response?.status
      });
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
