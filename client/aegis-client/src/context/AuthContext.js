import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const verifyAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      console.log('Verifying auth token...');
      const response = await authAPI.verifyToken();
      console.log('Token verification response:', response);

      setIsAuthenticated(true);
      setUser(response.user);
      return true;
    } catch (err) {
      console.error('Auth verification failed:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initial auth verification
  useEffect(() => {
    verifyAuth();
  }, []);

  // Periodic token verification
  useEffect(() => {
    if (isAuthenticated) {
      const intervalId = setInterval(verifyAuth, 5 * 60 * 1000); // Check every 5 minutes
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);

  const login = async (token) => {
    try {
      // Ensure token is properly formatted
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      localStorage.setItem('token', formattedToken);
      
      console.log('Stored auth token, verifying...');
      const verified = await verifyAuth();
      
      if (!verified) {
        throw new Error('Token verification failed after login');
      }
      
      console.log('Login successful and token verified');
    } catch (err) {
      console.error('Login error:', err);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    }
  };

  const logout = () => {
    console.log('Logging out user...');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      loading, 
      login, 
      logout,
      user,
      verifyAuth // Export verifyAuth for manual verification if needed
    }}>
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
