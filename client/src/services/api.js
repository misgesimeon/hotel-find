import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://backend-f428.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    console.log('Full URL:', config.baseURL + config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response);
    return response;
  },
  (error) => {
    console.error('Response error:', {
      message: error.message,
      response: error.response,
      config: error.config
    });
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Hotel API calls
export const hotelApi = {
  getAll: () => api.get('/v1/hotels'),
  getById: (id) => api.get(`/v1/hotels/${id}`),
  create: (data) => api.post('/v1/hotels', data),
  update: async (id, data) => {
    try {
      console.log('Updating hotel with data:', data);
      const response = await api.put(`/v1/hotels/${id}`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Update response:', response);
      
      if (!response.data) {
        throw new Error('No response data received');
      }
      
      return response;
    } catch (error) {
      console.error('Error updating hotel:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  },
  delete: (id) => api.delete(`/v1/hotels/${id}`),
  getInRadius: (zipcode, distance) => api.get(`/v1/hotels/radius/${zipcode}/${distance}`),
  getFeatured: () => api.get('/v1/hotels/featured'),
  search: (params) => api.get('/v1/hotels/search', { params }),
  assignManager: (hotelId, managerEmail) => api.put(`/v1/hotels/${hotelId}/manager`, { managerEmail }),
  getHotelBookings: (hotelId) => api.get(`/v1/bookings/hotel/${hotelId}`),
  getHotelRooms: (hotelId) => api.get(`/v1/rooms/hotel/${hotelId}`),
  uploadImages: async (hotelId, formData) => {
    try {
      console.log('Uploading images for hotel:', {
        hotelId,
        formData: formData
      });

      const response = await api.post(
        `/v1/hotels/${hotelId}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Image upload response:', response);
      return response;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  }
};

// Booking API calls
export const bookingApi = {
  getAll: () => api.get('/v1/bookings'),
  getById: (id) => api.get(`/v1/bookings/${id}`),
  getByUser: (userId) => api.get(`/v1/bookings/user/${userId}`),
  create: (data) => api.post('/v1/bookings', data),
  update: (id, data) => api.put(`/v1/bookings/${id}`, data),
  delete: (id) => api.delete(`/v1/bookings/${id}`),
  getHotelBookings: (hotelId, queryParams = '') => api.get(`/v1/bookings/hotel/${hotelId}${queryParams ? `?${queryParams}` : ''}`),
  confirm: (id, data) => api.post(`/v1/bookings/${id}/confirm`, data),
  cancel: (id) => api.put(`/v1/bookings/${id}/cancel`),
  createPaymentIntent: (data) => api.post('/v1/payments/create-intent', data),
  createTelebirrPayment: (data) => api.post('/v1/payments/telebirr', data),
  checkTelebirrPaymentStatus: (paymentId) => api.get(`/v1/payments/telebirr/${paymentId}/status`),
  getBookingDetails: (bookingId) => api.get(`/v1/bookings/${bookingId}`),
  checkRoomAvailability: (data) => api.post('/v1/bookings/check-availability', data)
};

// Room API calls
export const roomApi = {
  getAll: () => api.get('/v1/rooms'),
  getById: (id) => api.get(`/v1/rooms/${id}`),
  create: (data) => api.post('/v1/rooms', data),
  update: async (roomId, roomData) => {
    try {
      if (!roomId) {
        throw new Error('Room ID is required for update');
      }

      const response = await api.put(
        `/v1/rooms/${roomId}`,
        roomData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  },
  delete: (id) => api.delete(`/v1/rooms/${id}`),
  getHotelRooms: (hotelId) => api.get(`/v1/rooms/hotel/${hotelId}`),
  getAvailableRooms: (hotelId) => api.get(`/v1/rooms/hotel/${hotelId}/available`),
  checkAvailability: (roomId, data) => api.post(`/v1/rooms/${roomId}/availability`, data),
  uploadImages: async (roomId, formData) => {
    try {
      if (!roomId) {
        console.error('Room ID is missing:', { roomId, formData });
        throw new Error('Room ID is required for image upload');
      }

      // Log the request details
      console.log('Uploading images for room:', {
        roomId,
        formData: formData
      });

      const response = await api.post(
        `/v1/rooms/${roomId}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Log the response
      console.log('Image upload response:', response);

      return response;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },
  deleteImage: (roomId, imageId) => api.delete(`/v1/rooms/${roomId}/images/${imageId}`)
};

// Auth API calls
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  getUsers: () => api.get('/auth/users'),
  updateUserRole: (userId, role) => {
    console.log('Updating user role:', { userId, role });
    return api.put(`/auth/users/${userId}/role`, { role });
  },
};

export default api; 
