import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const useSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        'http://localhost:4000/api/payment/subscription-status',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSubscription(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Subscription check error:', err);
      setError(err.response?.data?.message || 'Failed to check subscription status');
      setLoading(false);
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
