import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const isPaymentFlow = window.location.pathname.includes('/payment');
      console.log('Verifying token...', { isPaymentFlow });

      const verifyResponse = await authAPI.verifyToken();
      console.log('Token verification response:', verifyResponse);

      if (!verifyResponse || !verifyResponse.valid) {
        console.log('Token is invalid, clearing auth state...');
        if (!isPaymentFlow) {
          localStorage.removeItem('token');
          setUser(null);
        }
        return;
      }

      // Skip profile fetch during payment flow to avoid unnecessary requests
      if (!isPaymentFlow) {
        console.log('Token is valid, fetching profile...');
        try {
          const profileData = await authAPI.getProfile();
          console.log('Profile response:', profileData);
          
          // Ensure we have valid user data
          if (!profileData || typeof profileData !== 'object') {
            throw new Error('Invalid profile data format');
          }

          // Extract user data with fallbacks
          const userData = {
            ...profileData,
            username: profileData.username || profileData.name || '',
            email: profileData.email || ''
          };

          setUser(userData);
        } catch (profileError) {
          console.error('Profile fetch failed:', profileError);
          // Don't clear auth state on profile fetch error
          if (!isPaymentFlow) {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } else {
        console.log('Skipping profile fetch during payment flow');
        // Keep existing user data during payment flow
        if (!user) {
          setUser({ authenticated: true });
        }
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      const isPaymentFlow = window.location.pathname.includes('/payment');
      if (!isPaymentFlow) {
        localStorage.removeItem('token');
        setUser(null);
      } else {
        console.log('Keeping auth state during payment flow');
        if (!user) {
          setUser({ authenticated: true });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      console.log('Attempting login...');
      const response = await authAPI.login(credentials);
      console.log('Login response:', response);
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }
      
      if (!response.token) {
        console.error('No token received from server');
        throw new Error('No token received from server');
      }

      console.log('Setting auth state...');
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to login';
      setError(errorMessage);
      return false;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    // Force reload to clear any cached state
    window.location.href = '/';
  };

  const register = async (userData) => {
    try {
      setError(null);
      console.log('Attempting registration...');
      const response = await authAPI.register(userData);
      console.log('Registration response:', response);

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      if (!response.token) {
        console.error('No token received from server');
        throw new Error('No token received from server');
      }

      console.log('Setting auth state...');
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to register';
      setError(errorMessage);
      return false;
    }
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      console.log('Updating profile...');

      const response = await authAPI.updateProfile(data);
      console.log('Update profile response:', response);
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }
      
      // Update the user data with the response
      const userData = {
        ...response,
        username: response.username || response.name || '',
        email: response.email || ''
      };
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile';
      setError(errorMessage);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    verifyAuth,
    isAuthenticated: !!user
  };

  console.log('AuthContext state:', { user, loading, error });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
