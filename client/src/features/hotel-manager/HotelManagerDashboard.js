import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Container,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  MenuItem,
  Divider,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Hotel as HotelIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { hotelApi, bookingApi, roomApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  LocalizationProvider,
  DatePicker,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const drawerWidth = 240;

const HotelManagerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('rooms');
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false);
  const [showEditRoomDialog, setShowEditRoomDialog] = useState(false);
  const [showEditHotelDialog, setShowEditHotelDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    type: '',
    description: '',
    price: '',
    capacity: { adults: 1, children: 0 },
    amenities: [],
    isAvailable: true,
    images: [],
    imageFiles: []
  });
  const [updatedHotel, setUpdatedHotel] = useState({
    name: '',
    description: '',
    location: {
      address: '',
      coordinates: [0, 0]
    },
    images: [],
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    amenities: [],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    policies: {
      cancellation: '',
      pets: '',
      smoking: ''
    }
  });
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [bookingFilters, setBookingFilters] = useState({
    createdAt: null,
    checkIn: null,
    checkOut: null,
    searchQuery: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('month'); // 'week', 'month', 'year'
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [makeBookingForm, setMakeBookingForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerIdNumber: '', // Add ID number field
    roomId: '',
    checkIn: null,
    checkOut: null,
    guests: 1,
    children: 0,
    paymentMethod: 'cash'
  });
  const [makeBookingLoading, setMakeBookingLoading] = useState(false);
  const navigate = useNavigate();

  // Add state for room availability
  const [roomAvailability, setRoomAvailability] = useState({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Add state for booking tab
  const [bookingTab, setBookingTab] = useState('all');

  // Add function to get available dates
  const getAvailableDates = async (roomId) => {
    if (!roomId) return { minDate: new Date(), maxDate: null };

    try {
      setLoadingAvailability(true);
      // Get room details with bookings
      const response = await roomApi.getById(roomId);
      const roomData = response.data.data;

      if (!roomData) {
        throw new Error('Room data not found');
      }

      // Create availability map for the next 3 months
      const availabilityMap = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(today.getMonth() + 3);
      threeMonthsLater.setHours(23, 59, 59, 999);

      // Initialize all dates as available
      for (let date = new Date(today); date <= threeMonthsLater; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        availabilityMap[dateStr] = {
          isAvailable: true,
          booking: null
        };
      }

      // Mark booked dates as unavailable
      if (roomData.bookings && Array.isArray(roomData.bookings)) {
        roomData.bookings.forEach(booking => {
          if (booking.status === 'confirmed' || booking.status === 'confirmed by Hotel') {
            const checkIn = new Date(booking.checkInDate || booking.checkIn);
            checkIn.setHours(0, 0, 0, 0);
            const checkOut = new Date(booking.checkOutDate || booking.checkOut);
            checkOut.setHours(0, 0, 0, 0);
            
            for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
              const dateStr = date.toISOString().split('T')[0];
              availabilityMap[dateStr] = {
                isAvailable: false,
                booking: {
                  checkIn: booking.checkInDate || booking.checkIn,
                  checkOut: booking.checkOutDate || booking.checkOut,
                  status: booking.status
                }
              };
            }
          }
        });
      }

      setRoomAvailability(availabilityMap);
      console.log('Room availability map:', availabilityMap);

      return {
        minDate: today,
        maxDate: threeMonthsLater,
        shouldDisableDate: (date) => {
          const dateStr = date.toISOString().split('T')[0];
          return !availabilityMap[dateStr]?.isAvailable;
        }
      };
    } catch (error) {
      console.error('Error getting available dates:', error);
      return { minDate: new Date(), maxDate: null };
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Add effect to load room availability when room is selected
  useEffect(() => {
    if (makeBookingForm.roomId) {
      getAvailableDates(makeBookingForm.roomId);
    }
  }, [makeBookingForm.roomId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user || user.role !== 'hotel_manager') {
          setError('Access denied. Please log in as a hotel manager.');
          return;
        }

        if (!user.hotel || !user.hotel._id) {
          setError('No hotel assigned. Please contact the administrator to be assigned to a hotel.');
          return;
        }

        const hotelResponse = await hotelApi.getById(user.hotel._id);
        const hotelData = hotelResponse.data.data;
        setHotel(hotelData);

        const roomsResponse = await hotelApi.getHotelRooms(hotelData._id);
        const roomsData = roomsResponse.data.data.map(room => {
          return {
            ...room,
            _id: room._id || room.id,
            id: room._id || room.id
          };
        });
        setRooms(roomsData);

        // Fetch bookings with filters
        const queryParams = new URLSearchParams();
        if (bookingFilters.createdAt) {
          queryParams.append('createdAt', bookingFilters.createdAt.toISOString());
        }
        if (bookingFilters.checkIn) {
          const checkInDate = new Date(bookingFilters.checkIn);
          checkInDate.setHours(0, 0, 0, 0);
          queryParams.append('checkIn', checkInDate.toISOString());
        }
        if (bookingFilters.checkOut) {
          const checkOutDate = new Date(bookingFilters.checkOut);
          checkOutDate.setHours(23, 59, 59, 999);
          queryParams.append('checkOut', checkOutDate.toISOString());
        }

        console.log('Query params:', queryParams.toString());
        const bookingsResponse = await bookingApi.getHotelBookings(hotelData._id, queryParams.toString());
        console.log('Raw booking data:', JSON.stringify(bookingsResponse.data.data, null, 2));
        console.log('First booking room data:', bookingsResponse.data.data[0]?.room);
        setBookings(bookingsResponse.data.data);
        setFilteredBookings(bookingsResponse.data.data);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, bookingFilters.createdAt, bookingFilters.checkIn, bookingFilters.checkOut]);

  const handleAddRoom = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user || !user.hotel || !user.hotel._id) {
        setError('No hotel assigned. Please contact the administrator to be assigned to a hotel.');
        return;
      }

      // Validate required fields
      if (!newRoom.roomNumber?.trim()) {
        setError('Room number is required');
        return;
      }

      if (!newRoom.type?.trim()) {
        setError('Room type is required');
        return;
      }

      if (!newRoom.description?.trim()) {
        setError('Description is required');
        return;
      }

      if (!newRoom.price || isNaN(parseFloat(newRoom.price)) || parseFloat(newRoom.price) <= 0) {
        setError('Valid price is required');
        return;
      }

      const adults = parseInt(newRoom.capacity.adults);
      const children = parseInt(newRoom.capacity.children);

      if (isNaN(adults) || adults < 1) {
        setError('Adult capacity must be at least 1');
        return;
      }

      if (isNaN(children) || children < 0) {
        setError('Children capacity cannot be negative');
        return;
      }

      // First create the room without images
      const roomData = {
        roomNumber: newRoom.roomNumber.trim(),
        type: newRoom.type.trim(),
        description: newRoom.description.trim(),
        price: parseFloat(newRoom.price),
        capacity: {
          adults: adults,
          children: children
        },
        amenities: newRoom.amenities || [],
        isAvailable: true,
        hotel: user.hotel._id,
        images: []
      };

      // Create the room first
      const response = await roomApi.create(roomData);
      console.log('Room creation response:', response);
      const createdRoom = response.data.data;
      console.log('Created room object:', createdRoom);

      // Check if we have a valid room ID
      const roomId = createdRoom?._id || createdRoom?.id;
      if (!roomId) {
        console.error('No room ID in response:', createdRoom);
        setError('Failed to create room. No room ID returned.');
        setLoading(false);
        return;
      }

      // Then upload images if there are any
      if (newRoom.imageFiles && newRoom.imageFiles.length > 0) {
        const formData = new FormData();
        newRoom.imageFiles.forEach(file => {
          formData.append('images', file);
        });
        
        try {
          console.log('Uploading images for room ID:', roomId);
          const uploadResponse = await roomApi.uploadImages(roomId, formData);
          console.log('Image upload response:', uploadResponse);
          
          if (uploadResponse.data && uploadResponse.data.data) {
            // Update the room with the uploaded images
            const updatedRoom = {
              ...createdRoom,
              images: uploadResponse.data.data
            };
            setRooms([...rooms, updatedRoom]);
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          setError('Room created but failed to upload images. Please try uploading images again.');
          // Still add the room without images
          setRooms([...rooms, createdRoom]);
          return;
        }
      } else {
        // If no images, just add the room as is
        setRooms([...rooms, createdRoom]);
      }
      
      // Reset the form
      setNewRoom({
        roomNumber: '',
        type: '',
        description: '',
        price: '',
        capacity: {
          adults: 1,
          children: 0
        },
        amenities: [],
        isAvailable: true,
        images: [],
        imageFiles: []
      });
      
      setShowAddRoomDialog(false);
      setSuccess('Room added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding room:', error);
      setError(error.response?.data?.message || 'Failed to add room');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoom = (room) => {
    console.log('handleEditRoom called with room:', room);
    
    if (!room) {
      console.error('No room data provided');
      setError('Invalid room data: No room data provided');
      return;
    }

    // Log the room ID fields to debug
    console.log('Room ID fields:', {
      _id: room._id,
      id: room.id,
      rawRoom: room
    });

    const roomId = room._id || room.id;
    if (!roomId) {
      console.error('Room ID missing in room data:', room);
      setError('Invalid room data: Room ID is missing');
      return;
    }

    // Create a new object with all required fields
    const roomToEdit = {
      _id: roomId,
      id: roomId,
      roomNumber: room.roomNumber || '',
      type: room.type || '',
      description: room.description || '',
      price: room.price ? room.price.toString() : '0',
      capacity: {
        adults: room.capacity?.adults?.toString() || '1',
        children: room.capacity?.children?.toString() || '0'
      },
      amenities: room.amenities || [],
      images: room.images || [],
      newImages: [],
      isAvailable: room.isAvailable !== undefined ? room.isAvailable : true
    };

    console.log('Setting editing room to:', roomToEdit);
    setEditingRoom(roomToEdit);
    setShowEditRoomDialog(true);
    setError(''); // Clear any previous errors
  };

  const handleUpdateRoom = async () => {
    console.log('handleUpdateRoom called with editingRoom:', editingRoom);
    
    try {
      setLoading(true);
      setError('');

      if (!editingRoom) {
        console.error('No editing room data');
        setError('Invalid room data: No room data provided');
        return;
      }

      if (!editingRoom._id) {
        console.error('Editing room missing ID:', editingRoom);
        setError('Invalid room data: Room ID is missing');
        return;
      }

      // Validate required fields
      if (!editingRoom.roomNumber?.trim()) {
        setError('Room number is required');
        return;
      }

      if (!editingRoom.type?.trim()) {
        setError('Room type is required');
        return;
      }

      if (!editingRoom.description?.trim()) {
        setError('Description is required');
        return;
      }

      if (!editingRoom.price || isNaN(parseFloat(editingRoom.price)) || parseFloat(editingRoom.price) <= 0) {
        setError('Valid price is required');
        return;
      }

      const adults = parseInt(editingRoom.capacity.adults);
      const children = parseInt(editingRoom.capacity.children);

      if (isNaN(adults) || adults < 1) {
        setError('Adult capacity must be at least 1');
        return;
      }

      if (isNaN(children) || children < 0) {
        setError('Children capacity cannot be negative');
        return;
      }

      // Handle any new images first
      let uploadedImages = [];
      if (editingRoom.newImages && editingRoom.newImages.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < editingRoom.newImages.length; i++) {
          const file = editingRoom.newImages[i];
          if (file instanceof File) {
            formData.append('images', file);
          }
        }
        
        if (formData.has('images')) {
          try {
            console.log('Uploading new images for room:', editingRoom._id);
            const uploadResponse = await roomApi.uploadImages(editingRoom._id, formData);
            console.log('Image upload response:', uploadResponse);
            
            if (uploadResponse.data && uploadResponse.data.data) {
              uploadedImages = uploadResponse.data.data;
            } else {
              throw new Error('Invalid response from server');
            }
          } catch (uploadError) {
            console.error('Error uploading images:', uploadError);
            setError('Failed to upload images. Please try again.');
            return;
          }
        }
      }

      const roomData = {
        _id: editingRoom._id,
        roomNumber: editingRoom.roomNumber.trim(),
        type: editingRoom.type.trim(),
        description: editingRoom.description.trim(),
        price: parseFloat(editingRoom.price),
        capacity: {
          adults: adults,
          children: children
        },
        amenities: editingRoom.amenities || [],
        isAvailable: editingRoom.isAvailable,
        images: [...(editingRoom.images || []), ...uploadedImages]
      };

      console.log('Updating room with data:', roomData);

      const response = await roomApi.update(editingRoom._id, roomData);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      // Update the rooms state
      setRooms(rooms.map(room => 
        room._id === editingRoom._id ? response.data.data : room
      ));

      setShowEditRoomDialog(false);
      setEditingRoom(null);
      setSuccess('Room updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error in handleUpdateRoom:', error);
      setError(error.response?.data?.message || 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (room) => {
    console.log('Delete clicked for room:', room);
    const roomId = room._id || room.id;
    if (!roomId) {
      console.error('Room ID missing:', room);
      setError('Invalid room data: Room ID is missing');
      return;
    }
    setRoomToDelete(roomId);
    setShowDeleteConfirmDialog(true);
  };

  const handleDeleteRoom = async (roomId) => {
    if (!roomId) {
      setError('Invalid room ID');
      return;
    }

    try {
      setLoading(true);
      setError('');

    // Check if the room has any active bookings
    const roomBookings = bookings.filter(booking => 
      booking.room?._id === roomId && 
      booking.status !== 'cancelled' && 
      new Date(booking.checkOut) > new Date()
    );

    if (roomBookings.length > 0) {
      setError('Cannot delete room with active bookings');
      return;
    }

      console.log('Deleting room with ID:', roomId);
      const response = await roomApi.delete(roomId);
      console.log('Delete response:', response);

      if (response.data.success) {
      // Update the rooms state
      setRooms(rooms.filter(room => room._id !== roomId));

      // If we're viewing the image gallery for this room, close it
      if (selectedRoom && selectedRoom._id === roomId) {
        setShowImageGallery(false);
        setSelectedRoom(null);
      }

      // If we're editing this room, close the edit dialog
      if (editingRoom && editingRoom._id === roomId) {
        setShowEditRoomDialog(false);
        setEditingRoom(null);
      }

      // Show success message
        setSuccess('Room deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      setError(error.response?.data?.message || error.message || 'Failed to delete room');
    } finally {
      setLoading(false);
      setShowDeleteConfirmDialog(false);
      setRoomToDelete(null);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      setLoading(true);
      setError('');

      if (action === 'confirm') {
        await bookingApi.confirm(bookingId);
      } else if (action === 'cancel') {
        await bookingApi.cancel(bookingId);
      }

      // Refresh bookings data after action
      const bookingsResponse = await bookingApi.getHotelBookings(hotel._id);
      setBookings(bookingsResponse.data.data);
    } catch (error) {
      console.error('Error updating booking:', error);
      setError(error.response?.data?.message || `Failed to ${action} booking`);
    } finally {
      setLoading(false);
    }
  };

  // Add function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Add function to get booking status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Add function to get booking status text
  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setLoading(true);
      setError('');

      // Create FormData for image upload
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      // Store the actual files in the state
      setNewRoom(prev => ({
        ...prev,
        imageFiles: Array.from(files),
        images: [...prev.images, ...Array.from(files).map(file => URL.createObjectURL(file))]
      }));

    } catch (error) {
      console.error('Error handling images:', error);
      setError(error.response?.data?.message || 'Failed to process images');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setNewRoom(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleEditImageUpload = async (event) => {
    try {
      setError('');
      setSuccess('');
      
      if (!editingRoom || !editingRoom._id) {
        setError('No room selected for image upload');
        return;
      }

      if (!event.target.files || event.target.files.length === 0) {
        setError('Please select at least one image to upload');
        return;
      }

      const formData = new FormData();
      Array.from(event.target.files).forEach(file => {
        formData.append('images', file);
      });

      console.log('Uploading images:', {
        roomId: editingRoom._id,
        fileCount: event.target.files.length,
        formData: formData
      });

      const uploadResponse = await roomApi.uploadImages(editingRoom._id, formData);
      
      if (uploadResponse.data.success) {
        setSuccess('Images uploaded successfully');
        // Refresh room data
        const updatedRoom = await roomApi.getById(editingRoom._id);
        setEditingRoom(prev => ({
          ...prev,
          images: updatedRoom.data.data.images
        }));
      } else {
        throw new Error(uploadResponse.data.message || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error.response?.data?.message || error.message || 'Failed to upload images');
    }
  };

  const handleRemoveEditImage = (index) => {
    setEditingRoom(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      newImages: prev.newImages ? prev.newImages.filter((_, i) => i !== index) : []
    }));
  };

  const handleViewImages = (room) => {
    setSelectedRoom(room);
    setShowImageGallery(true);
  };

  const handleUpdateHotel = async () => {
    try {
      if (!user.hotel?._id) {
        setError('No hotel assigned');
        return;
      }

      setLoading(true);
      setError('');

      // Handle image uploads first
      let uploadedImages = [];
      if (updatedHotel.newImages && updatedHotel.newImages.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < updatedHotel.newImages.length; i++) {
          const file = updatedHotel.newImages[i];
          if (file instanceof File) {
            formData.append('images', file);
          }
        }
        
        if (formData.has('images')) {
          const uploadResponse = await hotelApi.uploadImages(user.hotel._id, formData);
          uploadedImages = uploadResponse.data.data.images || [];
        }
      }

      // Filter out any blob URLs from existing images
      const existingImages = (updatedHotel.images || []).filter(image => {
        if (typeof image === 'string') {
          return !image.startsWith('blob:');
        }
        return true;
      });

      // Prepare the hotel data for the API
      const hotelData = {
        name: updatedHotel.name,
        description: updatedHotel.description,
        location: {
          address: updatedHotel.location.address,
          coordinates: updatedHotel.location.coordinates
        },
        contactInfo: {
          phone: updatedHotel.contactInfo?.phone || '',
          email: updatedHotel.contactInfo?.email || '',
          website: updatedHotel.contactInfo?.website || ''
        },
        checkInTime: updatedHotel.checkInTime,
        checkOutTime: updatedHotel.checkOutTime,
        policies: {
          cancellation: updatedHotel.policies?.cancellation || '',
          pets: updatedHotel.policies?.pets || '',
          smoking: updatedHotel.policies?.smoking || ''
        },
        images: [...existingImages, ...uploadedImages]
      };

      // Make the API call to update the hotel
      const response = await hotelApi.update(user.hotel._id, hotelData);
      
      if (response.data.success) {
      setHotel(response.data.data);
      setShowEditHotelDialog(false);
        setSuccess('Hotel profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to update hotel profile');
      }
    } catch (error) {
      console.error('Error updating hotel:', error);
      setError(error.response?.data?.message || 'Failed to update hotel profile');
    } finally {
      setLoading(false);
    }
  };

  // Update the initial state when opening the edit dialog
  const handleEditHotelClick = () => {
    setUpdatedHotel({
      name: hotel?.name || '',
      description: hotel?.description || '',
      location: hotel?.location || { address: '', coordinates: [0, 0] },
      contactInfo: {
        phone: hotel?.contactInfo?.phone || '',
        email: hotel?.contactInfo?.email || '',
        website: hotel?.contactInfo?.website || ''
      },
      checkInTime: hotel?.checkInTime || '14:00',
      checkOutTime: hotel?.checkOutTime || '12:00',
      policies: {
        cancellation: hotel?.policies?.cancellation || '',
        pets: hotel?.policies?.pets || '',
        smoking: hotel?.policies?.smoking || ''
      },
      images: hotel?.images || [],
      newImages: []
    });
    setShowEditHotelDialog(true);
  };

  const handleHotelImageUpload = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
    setUpdatedHotel(prev => ({
      ...prev,
      images: [...(prev.images || []), ...imageUrls],
      newImages: [...(prev.newImages || []), ...Array.from(files)]
    }));
  };

  const handleRemoveHotelImage = (index) => {
    setUpdatedHotel(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      newImages: prev.newImages ? prev.newImages.filter((_, i) => i !== index) : []
    }));
  };

  const getImageUrl = (image) => {
    if (!image) return '/images/no-image.svg';
    
    // If it's a string URL
    if (typeof image === 'string') {
      if (image.startsWith('blob:')) return image;
      if (image.startsWith('http')) return image;
      if (image.startsWith('/uploads/')) {
        return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image}`;
      }
      // Default to hotel images for backward compatibility
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/hotels/${image}`;
    }
    
    // If it's an object with url property
    if (image.url) {
      if (image.url.startsWith('blob:')) return image.url;
      if (image.url.startsWith('http')) return image.url;
      if (image.url.startsWith('/uploads/')) {
        return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image.url}`;
      }
      // Default to hotel images for backward compatibility
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/hotels/${image.filename || image.url}`;
    }
    
    // If it's an object with filename property
    if (image.filename) {
      // Default to hotel images for backward compatibility
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/hotels/${image.filename}`;
    }
    
    return '/images/no-image.svg';
  };

  const handleImageError = (e, room) => {
    console.error('Image load error:', {
      src: e.target.src,
      roomId: room?._id,
      image: room?.images?.[0],
      roomData: room
    });
    e.target.onerror = null;
    e.target.src = '/images/no-image.svg';
  };

  const renderRoomImage = (room) => {
    if (!room.images || room.images.length === 0) {
      return (
        <Box
          sx={{
            width: 100,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.100',
            borderRadius: 1
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No image
          </Typography>
        </Box>
      );
    }

    const imageUrl = getImageUrl(room.images[0]);
    console.log('Rendering room image:', {
      roomId: room._id,
      image: room.images[0],
      imageUrl
    });

    return (
      <Box
        sx={{
          width: 100,
          height: 60,
          position: 'relative',
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: 'grey.100',
          '&:hover .image-overlay': {
            opacity: 1
          }
        }}
      >
        <img
          src={imageUrl}
          alt={`Room ${room.roomNumber}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          onError={(e) => handleImageError(e, room)}
          crossOrigin="anonymous"
        />
      </Box>
    );
  };

  const handleDeleteImage = async (roomId, imageId) => {
    try {
      setLoading(true);
      setError('');
      await roomApi.deleteImage(roomId, imageId);
      
      // Update the room's images in the state
      setRooms(rooms.map(room => {
        if (room._id === roomId) {
          return {
            ...room,
            images: room.images.filter(img => img._id !== imageId)
          };
        }
        return room;
      }));

      // If we're viewing the image gallery, update the selected room
      if (selectedRoom && selectedRoom._id === roomId) {
        setSelectedRoom(prev => ({
          ...prev,
          images: prev.images.filter(img => img._id !== imageId)
        }));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError(error.response?.data?.message || 'Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  const handleClearFilters = () => {
    setBookingFilters({
      createdAt: null,
      checkIn: null,
      checkOut: null,
      searchQuery: ''
    });
    setFilteredBookings(bookings);
  };

  const filterBookings = () => {
    if (!bookings) return;
    
    const filtered = bookings.filter(booking => {
      const searchQuery = bookingFilters.searchQuery.toLowerCase();
      const userName = (booking.user?.name || '').toLowerCase();
      const userEmail = (booking.user?.email || '').toLowerCase();
      const customerName = (booking.customerName || '').toLowerCase();
      const customerEmail = (booking.customerEmail || '').toLowerCase();
      
      // For Local section, only include manager-created bookings
      if (bookingTab === 'local') {
        if (!booking.createdBy || !user || booking.createdBy !== user._id) {
          return false;
        }
      }
      
      return userName.includes(searchQuery) || 
             userEmail.includes(searchQuery) || 
             customerName.includes(searchQuery) || 
             customerEmail.includes(searchQuery);
    });
    
    setFilteredBookings(filtered);
  };

  const calculateReportStats = () => {
    const now = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(now.getMonth() - 1);

    const startDate = dateRange.startDate || defaultStartDate;
    const endDate = dateRange.endDate || now;

    // Set end of day for end date to include all bookings on that day
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const periodBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= startDate && bookingDate <= endOfDay;
    });

    const totalRevenue = periodBookings.reduce((sum, booking) => 
      sum + (booking.totalPrice || 0), 0
    );

    const confirmedBookings = periodBookings.filter(booking => 
      booking.status === 'confirmed'
    );

    const cancelledBookings = periodBookings.filter(booking => 
      booking.status === 'cancelled'
    );

    const occupancyRate = rooms.length > 0 
      ? (confirmedBookings.length / (rooms.length * 30)) * 100 
      : 0;

    const averageBookingValue = confirmedBookings.length > 0
      ? totalRevenue / confirmedBookings.length
      : 0;

    return {
      totalBookings: periodBookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      totalRevenue,
      occupancyRate,
      averageBookingValue
    };
  };

  const handleClearDateFilters = () => {
    setDateRange({
      startDate: null,
      endDate: null
    });
    setReportPeriod('month');
  };

  // Add function to check if a date range is available
  const isDateRangeAvailable = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return false;
    
    // Convert dates to start of day for comparison
    const startDate = new Date(checkIn);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(checkOut);
    endDate.setHours(0, 0, 0, 0);
    
    // Check if check-out is after check-in
    if (endDate <= startDate) return false;
    
    // Check availability for each day in the range
    for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      if (!roomAvailability[dateStr]?.isAvailable) {
        return false;
      }
    }
    
    return true;
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Hotel Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate('/')}>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button selected={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')}>
          <ListItemIcon><HotelIcon /></ListItemIcon>
          <ListItemText primary="Rooms" />
        </ListItem>
        <ListItem button selected={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')}>
          <ListItemIcon><CalendarIcon /></ListItemIcon>
          <ListItemText primary="Booking Management" />
        </ListItem>
        <ListItem button selected={activeTab === 'makeBooking'} onClick={() => setActiveTab('makeBooking')}>
          <ListItemIcon><AddIcon /></ListItemIcon>
          <ListItemText primary="Make Booking" />
        </ListItem>
        <ListItem button onClick={() => setActiveTab('reports')}>
          <ListItemIcon>
            <BarChartIcon />
          </ListItemIcon>
          <ListItemText primary="Reports" />
        </ListItem>
        <ListItem button onClick={() => setActiveTab('profile')}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Hotel Profile" />
        </ListItem>
        <Divider />
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {activeTab === 'rooms' && 'Room Management'}
            {activeTab === 'bookings' && 'Booking Management'}
            {activeTab === 'reports' && 'Reports'}
            {activeTab === 'profile' && 'Hotel Profile'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
          mt: 8
        }}
      >
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {activeTab === 'rooms' && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Room Management</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowAddRoomDialog(true)}
              >
                Add Room
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>Room Number</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rooms.map(room => (
                    <TableRow key={room._id}>
                      <TableCell>
                        {renderRoomImage(room)}
                      </TableCell>
                      <TableCell>{room.roomNumber}</TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell>{room.description}</TableCell>
                      <TableCell>ETB {room.price}</TableCell>
                      <TableCell>
                        {room.capacity.adults} Adults
                        {room.capacity.children > 0 && `, ${room.capacity.children} Children`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={room.isAvailable ? 'Available' : 'Occupied'}
                          color={room.isAvailable ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            console.log('Edit button clicked for room:', room);
                            const roomId = room._id || room.id;
                            if (!roomId) {
                              console.error('Room missing ID:', room);
                              setError('Invalid room data: Room ID is missing');
                              return;
                            }
                            handleEditRoom(room);
                          }}
                          title="Edit Room"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(room)}
                          title="Delete Room"
                        >
                          <DeleteIcon />
                        </IconButton>
                        <IconButton
                          color="info"
                          onClick={() => handleViewImages(room)}
                          title="View Images"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rooms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No rooms found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {activeTab === 'bookings' && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Booking Management</Typography>
              <Tabs
                value={bookingTab}
                onChange={(_, newValue) => setBookingTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab label="All Bookings" value="all" />
                <Tab label="Local" value="local" />
              </Tabs>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Search by name or email"
                    variant="outlined"
                    size="small"
                    value={bookingFilters.searchQuery}
                    onChange={(e) => setBookingFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    sx={{ width: '100%', mb: 2 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={() => filterBookings()}
                            edge="end"
                          >
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={9}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Created At"
                        value={bookingFilters.createdAt}
                        onChange={(date) => setBookingFilters(prev => ({ ...prev, createdAt: date }))}
                        slotProps={{ textField: { size: 'small', sx: { width: '200px' } } }}
                      />
                      <DatePicker
                        label="Check In"
                        value={bookingFilters.checkIn}
                        onChange={(date) => setBookingFilters(prev => ({ ...prev, checkIn: date }))}
                        slotProps={{ textField: { size: 'small', sx: { width: '200px' } } }}
                      />
                      <DatePicker
                        label="Check Out"
                        value={bookingFilters.checkOut}
                        onChange={(date) => setBookingFilters(prev => ({ ...prev, checkOut: date }))}
                        slotProps={{ textField: { size: 'small', sx: { width: '200px' } } }}
                      />
                    </LocalizationProvider>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleClearFilters}
                      startIcon={<CloseIcon />}
                      disabled={!bookingFilters.searchQuery && !bookingFilters.createdAt && !bookingFilters.checkIn && !bookingFilters.checkOut}
                    >
                      Clear Filters
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                      Total Bookings: {bookingTab === 'all' ? bookings.length : bookings.filter(b => b.createdBy && user && b.createdBy === user._id).length}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Check In</TableCell>
                    <TableCell>Check Out</TableCell>
                    <TableCell>Total Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                    {bookingTab === 'all' && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(bookingTab === 'all' ? filteredBookings : filteredBookings.filter(b => b.createdBy && user && b.createdBy === user._id)).length > 0 ? (
                    (bookingTab === 'all' ? filteredBookings : filteredBookings.filter(b => b.createdBy && user && b.createdBy === user._id)).map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell>
                          {booking.customerName || booking.user?.name || 'Unknown'}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {booking.customerEmail || booking.user?.email || 'No email'}
                          </Typography>
                        </TableCell>
                        <TableCell>{booking.user?.idNumber || booking.customerIdNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {booking.room?.roomNumber || 
                           (booking.room?.room?.roomNumber) || 
                           (typeof booking.room === 'string' ? booking.room : 
                            booking.room?._id || 'N/A')}
                        </TableCell>
                        <TableCell>{formatDate(booking.checkInDate)}</TableCell>
                        <TableCell>{formatDate(booking.checkOutDate)}</TableCell>
                        <TableCell>ETB {booking.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(booking.status)}
                            color={getStatusColor(booking.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(booking.createdAt)}</TableCell>
                        {bookingTab === 'all' && (
                          <TableCell>
                            {booking.status === 'pending' && (
                              <>
                                <IconButton
                                  color="success"
                                  onClick={() => handleBookingAction(booking._id, 'confirm')}
                                  disabled={loading}
                                  title="Confirm Booking"
                                  size="small"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                                <IconButton
                                  color="error"
                                  onClick={() => handleBookingAction(booking._id, 'cancel')}
                                  disabled={loading}
                                  title="Cancel Booking"
                                  size="small"
                                >
                                  <BlockIcon />
                                </IconButton>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <IconButton
                                color="primary"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowBookingDetails(true);
                                }}
                                title="View Details"
                                size="small"
                              >
                                <VisibilityIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={bookingTab === 'all' ? 9 : 8} align="center">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {activeTab === 'reports' && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Reports & Analytics</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange.startDate}
                    onChange={(newDate) => setDateRange(prev => ({ ...prev, startDate: newDate }))}
                    slotProps={{ 
                      textField: { 
                        size: 'small', 
                        sx: { width: '150px' },
                        placeholder: 'Select date',
                        InputLabelProps: { shrink: true }
                      } 
                    }}
                  />
                  <DatePicker
                    label="End Date"
                    value={dateRange.endDate}
                    onChange={(newDate) => setDateRange(prev => ({ ...prev, endDate: newDate }))}
                    slotProps={{ 
                      textField: { 
                        size: 'small', 
                        sx: { width: '150px' },
                        placeholder: 'Select date',
                        InputLabelProps: { shrink: true }
                      } 
                    }}
                  />
                </LocalizationProvider>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearDateFilters}
                  startIcon={<CloseIcon />}
                  disabled={reportPeriod === 'month' && 
                    (!dateRange.startDate || !dateRange.endDate || 
                    (dateRange.startDate.getTime() === new Date(new Date().setMonth(new Date().getMonth() - 1)).getTime() &&
                    dateRange.endDate.getTime() === new Date().getTime()))
                  }
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>

            {(() => {
              const stats = calculateReportStats();
              return (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                        Booking Statistics
                  </Typography>
                      <Typography variant="h4" gutterBottom>
                        {stats.totalBookings}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Bookings
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                          Confirmed: {stats.confirmedBookings}
                      </Typography>
                        <Typography variant="body2">
                          Cancelled: {stats.cancelledBookings}
                      </Typography>
                    </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                        Revenue
                  </Typography>
                      <Typography variant="h4" gutterBottom>
                        ETB {stats.totalRevenue.toFixed(2)}
                  </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
              );
            })()}
          </Paper>
        )}

        {activeTab === 'profile' && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Hotel Profile</Typography>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditHotelClick}
              >
                Edit Profile
              </Button>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Hotel Images
                  </Typography>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 300,
                    aspectRatio: '4/3',
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 2,
                    backgroundColor: 'grey.100',
                  }}
                >
                  {hotel?.images && hotel.images.length > 0 ? (
                    <img
                      src={getImageUrl(hotel.images[0])}
                      alt={hotel.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/no-image.svg';
                      }}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        No image available
                      </Typography>
                    </Box>
                  )}
                </Box>
                  <Typography variant="body2" color="text.secondary">
                    {hotel?.images?.length || 0} images uploaded
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Basic Information
                  </Typography>
                <Typography variant="h5" gutterBottom>
                  {hotel?.name}
                </Typography>
                <Typography variant="body1" paragraph>
                  {hotel?.description}
                </Typography>
                </Paper>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Location Details
                </Typography>
                <Typography variant="body1">
                    <strong>Address:</strong> {hotel?.location?.address || 'No address specified'}
                </Typography>
                  {hotel?.location?.coordinates && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Coordinates: {hotel.location.coordinates[0]}, {hotel.location.coordinates[1]}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        )}

        {activeTab === 'makeBooking' && (
          <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom>Make Booking for Customer</Typography>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setMakeBookingLoading(true);
              setError('');
              setSuccess('');
              try {
                if (!makeBookingForm.customerName || !makeBookingForm.customerEmail || !makeBookingForm.customerIdNumber || !makeBookingForm.roomId || !makeBookingForm.checkIn || !makeBookingForm.checkOut || !makeBookingForm.paymentMethod) {
                  setError('Please fill in all required fields.');
                  setMakeBookingLoading(false);
                  return;
                }

                // Get total price from room availability API
                const availabilityResponse = await roomApi.checkAvailability(
                  makeBookingForm.roomId,
                  {
                    checkIn: makeBookingForm.checkIn,
                    checkOut: makeBookingForm.checkOut
                  }
                );
                const totalPrice = availabilityResponse.data.data.totalPrice;

                // Prepare booking data with correct field names
                const bookingData = {
                  customerName: makeBookingForm.customerName,
                  customerEmail: makeBookingForm.customerEmail,
                  customerPhone: makeBookingForm.customerPhone,
                  customerIdNumber: makeBookingForm.customerIdNumber, // Add ID number to booking data
                  room: makeBookingForm.roomId,
                  checkInDate: makeBookingForm.checkIn,
                  checkOutDate: makeBookingForm.checkOut,
                  guests: {
                    adults: makeBookingForm.guests,
                    children: makeBookingForm.children
                  },
                  createdBy: user._id,
                  hotel: hotel?._id,
                  paymentMethod: makeBookingForm.paymentMethod,
                  totalPrice
                };
                await bookingApi.create(bookingData);
                setSuccess('Booking created successfully!');
                setMakeBookingForm({
                  customerName: '',
                  customerEmail: '',
                  customerPhone: '',
                  customerIdNumber: '', // Reset ID number field
                  roomId: '',
                  checkIn: null,
                  checkOut: null,
                  guests: 1,
                  children: 0,
                  paymentMethod: 'cash'
                });
              } catch (err) {
                setError(err.response?.data?.message || 'Failed to create booking.');
              } finally {
                setMakeBookingLoading(false);
              }
            }}>
              <TextField
                label="Customer Name"
                value={makeBookingForm.customerName}
                onChange={e => setMakeBookingForm(f => ({ ...f, customerName: e.target.value }))}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Customer Email"
                value={makeBookingForm.customerEmail}
                onChange={e => setMakeBookingForm(f => ({ ...f, customerEmail: e.target.value }))}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Customer Phone"
                value={makeBookingForm.customerPhone}
                onChange={e => setMakeBookingForm(f => ({ ...f, customerPhone: e.target.value }))}
                fullWidth
                margin="normal"
              />
              <TextField
                label="National/Passport ID Number"
                value={makeBookingForm.customerIdNumber}
                onChange={e => setMakeBookingForm(f => ({ ...f, customerIdNumber: e.target.value }))}
                fullWidth
                margin="normal"
                required
                helperText="Enter customer's national ID or passport number"
              />
              <TextField
                select
                label="Room"
                value={makeBookingForm.roomId}
                onChange={e => {
                  setMakeBookingForm(f => ({ 
                    ...f, 
                    roomId: e.target.value,
                    checkIn: null,
                    checkOut: null
                  }));
                }}
                fullWidth
                margin="normal"
                required
              >
                {rooms.map(room => (
                  <MenuItem key={room._id} value={room._id}>
                    {room.roomNumber} - {room.type} (ETB {room.price})
                  </MenuItem>
                ))}
              </TextField>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Check-in Date"
                  value={makeBookingForm.checkIn}
                  onChange={date => {
                    if (date) {
                      date.setHours(0, 0, 0, 0);
                      setMakeBookingForm(f => ({ ...f, checkIn: date }));
                      // Reset check-out date if it's before the new check-in date
                      if (makeBookingForm.checkOut && date > makeBookingForm.checkOut) {
                        setMakeBookingForm(f => ({ ...f, checkOut: null }));
                      }
                    } 
                  }}
                  minDate={new Date()}
                  shouldDisableDate={(date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    return !roomAvailability[dateStr]?.isAvailable;
                  }}
                  renderDay={(day, selectedDate, isInCurrentMonth, dayComponent) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const isAvailable = roomAvailability[dateStr]?.isAvailable;
                    const booking = roomAvailability[dateStr]?.booking;
                    return (
                      <div
                        className={!isAvailable ? 'unavailable' : ''}
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          backgroundColor: !isAvailable ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                        }}
                        title={!isAvailable ? `Booked until ${new Date(booking?.checkOut).toLocaleDateString()}` : ''}
                      >
                        {dayComponent}
                      </div>
                    );
                  }}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      margin: 'normal', 
                      required: true,
                      error: makeBookingForm.checkIn && !roomAvailability[makeBookingForm.checkIn.toISOString().split('T')[0]]?.isAvailable,
                      helperText: makeBookingForm.checkIn && !roomAvailability[makeBookingForm.checkIn.toISOString().split('T')[0]]?.isAvailable ? 'This date is not available' : ''
                    } 
                  }}
                />
                <DatePicker
                  label="Check-out Date"
                  value={makeBookingForm.checkOut}
                  onChange={date => {
                    if (date) {
                      date.setHours(0, 0, 0, 0);
                      if (makeBookingForm.checkIn && !isDateRangeAvailable(makeBookingForm.checkIn, date)) {
                        setError('Selected dates are not available. Please choose different dates.');
                        return;
                      }
                      setMakeBookingForm(f => ({ ...f, checkOut: date }));
                      setError('');
                    } 
                  }}
                  minDate={makeBookingForm.checkIn || new Date()}
                  shouldDisableDate={(date) => {
                    if (!makeBookingForm.checkIn) return true;
                    const dateStr = date.toISOString().split('T')[0];
                    return !roomAvailability[dateStr]?.isAvailable;
                  }}
                  renderDay={(day, selectedDate, isInCurrentMonth, dayComponent) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const isAvailable = roomAvailability[dateStr]?.isAvailable;
                    const booking = roomAvailability[dateStr]?.booking;
                    return (
                      <div
                        className={!isAvailable ? 'unavailable' : ''}
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          backgroundColor: !isAvailable ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                        }}
                        title={!isAvailable ? `Booked until ${new Date(booking?.checkOut).toLocaleDateString()}` : ''}
                      >
                        {dayComponent}
                      </div>
                    );
                  }}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      margin: 'normal', 
                      required: true,
                      error: makeBookingForm.checkOut && !roomAvailability[makeBookingForm.checkOut.toISOString().split('T')[0]]?.isAvailable,
                      helperText: makeBookingForm.checkOut && !roomAvailability[makeBookingForm.checkOut.toISOString().split('T')[0]]?.isAvailable ? 'This date is not available' : ''
                    } 
                  }}
                />
              </LocalizationProvider>
              <TextField
                label="Guests (Adults)"
                type="number"
                value={makeBookingForm.guests}
                onChange={e => setMakeBookingForm(f => ({ ...f, guests: parseInt(e.target.value) }))}
                fullWidth
                margin="normal"
                inputProps={{ min: 1 }}
                required
              />
              <TextField
                label="Children"
                type="number"
                value={makeBookingForm.children}
                onChange={e => setMakeBookingForm(f => ({ ...f, children: parseInt(e.target.value) }))}
                fullWidth
                margin="normal"
                inputProps={{ min: 0 }}
              />
              <TextField
                select
                label="Payment Method"
                value={makeBookingForm.paymentMethod}
                onChange={e => setMakeBookingForm(f => ({ ...f, paymentMethod: e.target.value }))}
                fullWidth
                margin="normal"
                required
              >
                <MenuItem value="cash">Cash</MenuItem>
              </TextField>
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                disabled={makeBookingLoading || loadingAvailability}
              >
                {makeBookingLoading ? 'Booking...' : 'Make Booking'}
              </Button>
            </form>
          </Paper>
        )}

        {/* Add Room Dialog */}
        <Dialog
          open={showAddRoomDialog}
          onClose={() => setShowAddRoomDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add New Room</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Room Number"
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Room Type"
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                >
                  {['Single', 'Double', 'Suite', 'Deluxe', 'Family', 'Executive'].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={newRoom.price}
                  onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Adult Capacity"
                  type="number"
                  value={newRoom.capacity.adults}
                  onChange={(e) => setNewRoom({
                    ...newRoom,
                    capacity: { ...newRoom.capacity, adults: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Children Capacity"
                  type="number"
                  value={newRoom.capacity.children}
                  onChange={(e) => setNewRoom({
                    ...newRoom,
                    capacity: { ...newRoom.capacity, children: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Room Images
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="room-images-upload"
                    multiple
                    type="file"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="room-images-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      disabled={loading}
                    >
                      Upload Images
                    </Button>
                  </label>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  {newRoom.images.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 150,
                        height: 150,
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={image}
                        alt={`Room ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          },
                        }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddRoomDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRoom} variant="contained" disabled={loading}>
              Add Room
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Room Dialog */}
        <Dialog
          open={showEditRoomDialog}
          onClose={() => setShowEditRoomDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Room</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Room Number"
                  value={editingRoom?.roomNumber || ''}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev, roomNumber: e.target.value }))}
                  error={!editingRoom?.roomNumber?.trim()}
                  helperText={!editingRoom?.roomNumber?.trim() ? 'Room number is required' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Room Type"
                  value={editingRoom?.type || ''}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev, type: e.target.value }))}
                  error={!editingRoom?.type?.trim()}
                  helperText={!editingRoom?.type?.trim() ? 'Room type is required' : ''}
                >
                  {['Single', 'Double', 'Suite', 'Deluxe', 'Family', 'Executive'].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={editingRoom?.description || ''}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev, description: e.target.value }))}
                  error={!editingRoom?.description?.trim()}
                  helperText={!editingRoom?.description?.trim() ? 'Description is required' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={editingRoom?.price || ''}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev, price: e.target.value }))}
                  error={!editingRoom?.price || isNaN(parseFloat(editingRoom.price)) || parseFloat(editingRoom.price) <= 0}
                  helperText={!editingRoom?.price || isNaN(parseFloat(editingRoom.price)) || parseFloat(editingRoom.price) <= 0 ? 'Valid price is required' : ''}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Adult Capacity"
                  type="number"
                  value={editingRoom?.capacity?.adults || ''}
                  onChange={(e) => setEditingRoom(prev => ({
                    ...prev,
                    capacity: { ...prev.capacity, adults: e.target.value }
                  }))}
                  error={!editingRoom?.capacity?.adults || isNaN(parseInt(editingRoom.capacity.adults)) || parseInt(editingRoom.capacity.adults) < 1}
                  helperText={!editingRoom?.capacity?.adults || isNaN(parseInt(editingRoom.capacity.adults)) || parseInt(editingRoom.capacity.adults) < 1 ? 'Adult capacity must be at least 1' : ''}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Children Capacity"
                  type="number"
                  value={editingRoom?.capacity?.children || ''}
                  onChange={(e) => setEditingRoom(prev => ({
                    ...prev,
                    capacity: { ...prev.capacity, children: e.target.value }
                  }))}
                  error={!editingRoom?.capacity?.children || isNaN(parseInt(editingRoom.capacity.children)) || parseInt(editingRoom.capacity.children) < 0}
                  helperText={!editingRoom?.capacity?.children || isNaN(parseInt(editingRoom.capacity.children)) || parseInt(editingRoom.capacity.children) < 0 ? 'Children capacity cannot be negative' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Room Images
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="edit-room-images-upload"
                    multiple
                    type="file"
                    onChange={handleEditImageUpload}
                  />
                  <label htmlFor="edit-room-images-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      disabled={loading}
                    >
                      Upload Images
                    </Button>
                  </label>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  {editingRoom?.images?.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 150,
                        height: 150,
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Room ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          },
                        }}
                        onClick={() => handleRemoveEditImage(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEditRoomDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateRoom} 
              variant="contained" 
              disabled={loading || 
                !editingRoom?.roomNumber?.trim() ||
                !editingRoom?.type?.trim() ||
                !editingRoom?.description?.trim() ||
                !editingRoom?.price ||
                isNaN(parseFloat(editingRoom.price)) ||
                parseFloat(editingRoom.price) <= 0 ||
                !editingRoom?.capacity?.adults ||
                isNaN(parseInt(editingRoom.capacity.adults)) ||
                parseInt(editingRoom.capacity.adults) < 1 ||
                !editingRoom?.capacity?.children ||
                isNaN(parseInt(editingRoom.capacity.children)) ||
                parseInt(editingRoom.capacity.children) < 0
              }
            >
              Update Room
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Hotel Dialog */}
        <Dialog
          open={showEditHotelDialog}
          onClose={() => setShowEditHotelDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Hotel Profile</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Hotel Name"
                  value={updatedHotel.name}
                  onChange={(e) => setUpdatedHotel({ ...updatedHotel, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={updatedHotel.description}
                  onChange={(e) => setUpdatedHotel({ ...updatedHotel, description: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={updatedHotel.location.address}
                  onChange={(e) => setUpdatedHotel({
                    ...updatedHotel,
                    location: { ...updatedHotel.location, address: e.target.value }
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Contact Information
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={updatedHotel.contactInfo?.phone || ''}
                  onChange={(e) => setUpdatedHotel({
                    ...updatedHotel,
                    contactInfo: { ...updatedHotel.contactInfo, phone: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={updatedHotel.contactInfo?.email || ''}
                  onChange={(e) => setUpdatedHotel({
                    ...updatedHotel,
                    contactInfo: { ...updatedHotel.contactInfo, email: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Website"
                  value={updatedHotel.contactInfo?.website || ''}
                  onChange={(e) => setUpdatedHotel({
                    ...updatedHotel,
                    contactInfo: { ...updatedHotel.contactInfo, website: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Check-in/Check-out Times
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Check-in Time"
                  type="time"
                  value={updatedHotel.checkInTime}
                  onChange={(e) => setUpdatedHotel({ ...updatedHotel, checkInTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Check-out Time"
                  type="time"
                  value={updatedHotel.checkOutTime}
                  onChange={(e) => setUpdatedHotel({ ...updatedHotel, checkOutTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Hotel Policies
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cancellation Policy"
                  multiline
                  rows={2}
                  value={updatedHotel.policies?.cancellation || ''}
                  onChange={(e) => setUpdatedHotel({
                    ...updatedHotel,
                    policies: { ...updatedHotel.policies, cancellation: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Pet Policy"
                  multiline
                  rows={2}
                  value={updatedHotel.policies?.pets || ''}
                  onChange={(e) => setUpdatedHotel({
                    ...updatedHotel,
                    policies: { ...updatedHotel.policies, pets: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Smoking Policy"
                  multiline
                  rows={2}
                  value={updatedHotel.policies?.smoking || ''}
                  onChange={(e) => setUpdatedHotel({
                    ...updatedHotel,
                    policies: { ...updatedHotel.policies, smoking: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Hotel Images
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="hotel-images-upload"
                    multiple
                    type="file"
                    onChange={handleHotelImageUpload}
                  />
                  <label htmlFor="hotel-images-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      disabled={loading}
                    >
                      Upload Images
                    </Button>
                  </label>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  {updatedHotel.images?.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 150,
                        height: 150,
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Hotel ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          },
                        }}
                        onClick={() => handleRemoveHotelImage(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEditHotelDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateHotel} variant="contained" disabled={loading}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Image Gallery Dialog */}
        <Dialog
          open={showImageGallery}
          onClose={() => {
            setShowImageGallery(false);
            setSelectedRoom(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Room {selectedRoom?.roomNumber} Images
            <IconButton
              aria-label="close"
              onClick={() => {
                setShowImageGallery(false);
                setSelectedRoom(null);
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedRoom?.images && selectedRoom.images.length > 0 ? (
              <Grid container spacing={2}>
                {selectedRoom.images.map((image, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box
                      sx={{
                        position: 'relative',
                        paddingTop: '75%',
                        borderRadius: 1,
                        overflow: 'hidden',
                        '&:hover .image-actions': {
                          opacity: 1
                        }
                      }}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Room ${selectedRoom.roomNumber} - ${index + 1}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <Box
                        className="image-actions"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          gap: 1
                        }}
                      >
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteImage(selectedRoom._id, image._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200
                }}
              >
                <Typography color="text.secondary">
                  No images available for this room
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showDeleteConfirmDialog}
          onClose={() => {
            setShowDeleteConfirmDialog(false);
            setRoomToDelete(null);
          }}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this room? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowDeleteConfirmDialog(false);
              setRoomToDelete(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleDeleteRoom(roomToDelete)} 
              color="error"
              variant="contained"
              disabled={loading}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Booking Details Dialog */}
        <Dialog
          open={showBookingDetails}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedBooking(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Booking Details
            <IconButton
              aria-label="close"
              onClick={() => {
                setShowBookingDetails(false);
                setSelectedBooking(null);
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedBooking && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Guest Information
                  </Typography>
                  <Typography variant="body1">
                    <strong>Name:</strong> {selectedBooking.user?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Email:</strong> {selectedBooking.user?.email || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Phone:</strong> {selectedBooking.user?.phone || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Customer Information</Typography>
                  <Typography>Name: {selectedBooking.customerName || 'N/A'}</Typography>
                  <Typography>Email: {selectedBooking.customerEmail || 'N/A'}</Typography>
                  <Typography>Phone: {selectedBooking.customerPhone || 'N/A'}</Typography>
                  <Typography>ID Number: {selectedBooking.customerIdNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Booking Information
                  </Typography>
                  <Typography variant="body1">
                    <strong>Booking ID:</strong> {selectedBooking._id}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Room Number:</strong> {selectedBooking.room?.roomNumber || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Room Type:</strong> {selectedBooking.room?.type || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Check-in Date:</strong> {formatDate(selectedBooking.checkInDate)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Check-out Date:</strong> {formatDate(selectedBooking.checkOutDate)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Total Price:</strong> ETB {selectedBooking.totalPrice?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Status:</strong>{' '}
                    <Chip
                      label={getStatusText(selectedBooking.status)}
                      color={getStatusColor(selectedBooking.status)}
                      size="small"
                    />
                  </Typography>
                  <Typography variant="body1">
                    <strong>Created At:</strong> {formatDate(selectedBooking.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Guest Details
                  </Typography>
                  <Typography variant="body1">
                    <strong>Adults:</strong> {selectedBooking.guests?.adults || 0}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Children:</strong> {selectedBooking.guests?.children || 0}
                  </Typography>
                  {selectedBooking.specialRequests && (
                    <Typography variant="body1">
                      <strong>Special Requests:</strong> {selectedBooking.specialRequests}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowBookingDetails(false);
              setSelectedBooking(null);
            }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default HotelManagerDashboard; 