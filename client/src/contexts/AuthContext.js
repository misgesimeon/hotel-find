import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await authApi.getCurrentUser();
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('AuthContext - Attempting login for:', email);
      const response = await authApi.login({ email, password });
      console.log('AuthContext - Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data;
        console.log('AuthContext - Login successful:', {
          token: token ? 'Token received' : 'No token',
          user: user ? {
            id: user.id,
            role: user.role,
            hasHotel: !!user.hotel
          } : 'No user data'
        });

        // Store token
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Get updated user data with hotel information
        const userResponse = await authApi.getCurrentUser();
        console.log('AuthContext - Updated user data:', userResponse.data);

        if (userResponse.data.success) {
          setUser(userResponse.data.data);
          return { success: true, user: userResponse.data.data };
        } else {
          throw new Error('Failed to fetch user data after login');
        }
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      throw error; // Re-throw the error to be handled by the Login component
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      if (response.data.success) {
        const { token } = response.data;
        
        // Store token
      localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get updated user data with hotel information
        const userResponse = await authApi.getCurrentUser();
        if (userResponse.data.success) {
          setUser(userResponse.data.data);
          return { success: true, user: userResponse.data.data };
        } else {
          throw new Error('Failed to fetch user data after registration');
        }
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register
  };

  if (loading) {
    return <div>Loading...</div>;
  }

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