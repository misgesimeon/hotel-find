import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { authApi } from '../../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      console.log('AuthContext - Checking token:', token ? 'Token exists' : 'No token found');
      
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await authApi.getCurrentUser();
          console.log('AuthContext - Full response:', response);
          console.log('AuthContext - User data structure:', {
            success: response.data.success,
            data: response.data.data,
            role: response.data.data?.role,
            hotel: response.data.data?.hotel,
            hasHotel: !!response.data.data?.hotel,
            hotelId: response.data.data?.hotel?._id
          });
          
          if (response.data.success && response.data.data) {
            const userData = response.data.data;
            // Ensure role is set
            if (!userData.role) {
              console.error('AuthContext - User data missing role');
              localStorage.removeItem('token');
              delete axios.defaults.headers.common['Authorization'];
              return;
            }

            // For hotel managers, ensure they have a hotel assigned
            if (userData.role === 'hotel_manager' && !userData.hotel) {
              console.error('AuthContext - Hotel manager has no hotel assigned');
              localStorage.removeItem('token');
              delete axios.defaults.headers.common['Authorization'];
              return;
            }

            setUser(userData);
          } else {
            console.error('AuthContext - Invalid user data received');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        } catch (error) {
          console.error('AuthContext - Error fetching user data:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      } else {
        console.log('AuthContext - No token found, clearing auth state');
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
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
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const resetPassword = async (email) => {
    try {
      await authApi.forgotPassword({ email });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Password reset failed' };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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