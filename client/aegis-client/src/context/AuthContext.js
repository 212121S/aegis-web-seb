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

      console.log('Verifying token...');
      const response = await authAPI.verifyToken();
      console.log('Token verification response:', response);

      if (response.valid) {
        console.log('Token is valid, fetching profile...');
        const profileResponse = await authAPI.getProfile();
        console.log('Profile response:', profileResponse);
        setUser(profileResponse);
      } else {
        console.log('Token is invalid, clearing auth state...');
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      localStorage.removeItem('token');
      setUser(null);
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
      
      const { token, user: userData } = response;
      
      if (!token) {
        console.error('No token received from server');
        throw new Error('No token received from server');
      }

      console.log('Setting auth state...');
      localStorage.setItem('token', token);
      setUser(userData);
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

      const { token, user: newUser } = response;

      if (!token) {
        console.error('No token received from server');
        throw new Error('No token received from server');
      }

      console.log('Setting auth state...');
      localStorage.setItem('token', token);
      setUser(newUser);
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
      setUser(response);
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
    verifyAuth
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
