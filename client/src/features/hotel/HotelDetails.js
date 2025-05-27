import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardMedia,
  Rating,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Tabs,
  Tab,
  FormControl,
  Select
} from '@mui/material';
import {
  Wifi as WifiIcon,
  LocalParking as ParkingIcon,
  Restaurant as RestaurantIcon,
  Pool as PoolIcon,
  FitnessCenter as GymIcon,
  Spa as SpaIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { hotelApi, roomApi } from '../../services/api';
import PaymentForm from '../booking/PaymentForm';
import TelebirrPaymentForm from '../booking/TelebirrPaymentForm';

const amenityIcons = {
  wifi: <WifiIcon />,
  parking: <ParkingIcon />,
  restaurant: <RestaurantIcon />,
  pool: <PoolIcon />,
  gym: <GymIcon />,
  spa: <SpaIcon />,
};

const DatePickerStyles = {
  '& .MuiPickersDay-root.Mui-disabled': {
    color: 'rgba(0, 0, 0, 0.38)',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  '& .MuiPickersDay-root.Mui-selected': {
    backgroundColor: '#1976d2',
    color: 'white',
  },
  '& .MuiPickersDay-root.MuiPickersDay-today': {
    border: '1px solid #1976d2',
  },
  '& .MuiPickersDay-root.unavailable': {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
    '&:hover': {
      backgroundColor: 'rgba(244, 67, 54, 0.2)',
    },
  },
};

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    checkIn: null,
    checkOut: null,
    guests: 1,
    paymentMethod: 'card'
  });
  const [activeTab, setActiveTab] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [showTelebirrDialog, setShowTelebirrDialog] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [roomAvailability, setRoomAvailability] = useState({});
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        const [hotelResponse, roomsResponse] = await Promise.all([
          hotelApi.getById(id),
          hotelApi.getHotelRooms(id)
        ]);
        setHotel(hotelResponse.data.data);
        setRooms(roomsResponse.data.data);
      } catch (error) {
        setError('Failed to fetch hotel details');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [id]);

  const handleBookNow = (room) => {
    if (!user) {
      // Store the current URL and room details to redirect back after login
      localStorage.setItem('redirectAfterLogin', `/hotel/${id}`);
      localStorage.setItem('selectedRoom', JSON.stringify({
        id: room._id || room.id,
        type: room.type,
        price: room.price,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guests: bookingForm.guests
      }));
      navigate('/login');
      return;
    }

    // If user is logged in, show payment method selection
    setSelectedRoomForBooking({
      ...room,
      _id: room._id || room.id // Ensure we have the correct ID field
    });
    setShowPaymentMethodDialog(true);
  };

  const handlePaymentMethodSelect = (method) => {
    setShowPaymentMethodDialog(false);
    
    if (method === 'telebirr') {
      setShowTelebirrDialog(true);
    } else if (method === 'card') {
      setShowPaymentDialog(true);
    }
  };

  const handleTelebirrPaymentSuccess = async (paymentResponse) => {
    try {
      setShowTelebirrDialog(false);
      if (paymentResponse.bookingId) {
        navigate(`/bookings/${paymentResponse.bookingId}`);
      } else {
        navigate('/bookings');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setShowTelebirrDialog(false);
      navigate('/bookings');
    }
  };

  const handleSelectRoom = async (room) => {
    setSelectedRoom(room);
    setSelectedRoomForBooking(room);
    try {
      const roomId = room._id || room.id;
      if (!roomId) {
        throw new Error('Room ID is missing');
      }

      // Get room details with bookings from the backend
      const response = await roomApi.getById(roomId);
      const roomData = response.data.data;
      
      if (!roomData) {
        throw new Error('Room data not found');
      }

      // Create availability map for the next 3 months
      const availabilityMap = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(today.getMonth() + 3);
      threeMonthsLater.setHours(23, 59, 59, 999); // Set to end of day

      // Initialize all dates as available
      for (let date = new Date(today); date <= threeMonthsLater; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        availabilityMap[dateStr] = {
          isAvailable: true,
          booking: null
        };
      }

      // Mark booked dates as unavailable based on real bookings
      if (roomData.bookings && Array.isArray(roomData.bookings)) {
        roomData.bookings.forEach(booking => {
          if (booking.status === 'confirmed' || booking.status === 'confirmed by Hotel') {
            const checkIn = new Date(booking.checkIn);
            checkIn.setHours(0, 0, 0, 0); // Set to start of day
            const checkOut = new Date(booking.checkOut);
            checkOut.setHours(0, 0, 0, 0); // Set to start of day
            
            // Mark all dates from check-in to day before check-out as unavailable
            for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
              const dateStr = date.toISOString().split('T')[0];
              availabilityMap[dateStr] = {
                isAvailable: false,
                booking: {
                  checkIn: booking.checkIn,
                  checkOut: booking.checkOut,
                  status: booking.status
                }
              };
            }
          }
        });
      }

      setRoomAvailability(availabilityMap);
    } catch (error) {
      console.error('Error fetching room availability:', error);
      setError('Failed to fetch room availability. Please try again.');
    }
  };

  // Add helper function to check if a date range is available
  const isDateRangeAvailable = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    // Check if all dates in the range are available
    for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      if (!roomAvailability[dateStr]?.isAvailable) {
        return false;
      }
    }
    return true;
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

  const handleImageError = (e) => {
    console.error('Image load error:', e.target.src);
    e.target.onerror = null;
    e.target.src = '/images/no-image.svg';
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error || !hotel) {
    return (
      <Container>
        <Alert severity="error">{error || 'Hotel not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={getImageUrl(hotel.images?.[0])}
              alt={hotel.name}
              onError={handleImageError}
            />
            <CardContent>
              <Typography variant="h4" component="h1" gutterBottom>
                {hotel.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating value={hotel.rating} readOnly />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({hotel.reviews} reviews)
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                {hotel.description}
              </Typography>
              
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Overview" />
                <Tab label="Amenities" />
                <Tab label="Rooms" />
              </Tabs>

              <Box sx={{ mt: 3 }}>
                {activeTab === 0 && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Hotel Overview
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {hotel.overview || hotel.description}
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            <strong>Location:</strong> {hotel.location.address}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating value={hotel.rating} readOnly size="small" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({hotel.reviews} reviews)
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2">
                            <strong>Check-in:</strong> 2:00 PM
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2">
                            <strong>Check-out:</strong> 12:00 PM
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
                
                {activeTab === 1 && (
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Hotel Amenities
                    </Typography>
                    <Grid container spacing={2}>
                      {hotel.amenities?.map((amenity, index) => (
                        <Grid item xs={6} sm={4} key={`${amenity}-${index}`}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 2, 
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}>
                            {amenityIcons[amenity] || <WifiIcon />}
                            <Typography variant="body1" sx={{ ml: 1 }}>
                              {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}
                
                {activeTab === 2 && (
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Available Rooms
                    </Typography>
                    {rooms.length === 0 ? (
                      <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                        No rooms available at this time.
                      </Typography>
                    ) : (
                      <Grid container spacing={3}>
                        {rooms.map((room) => (
                          <Grid item xs={12} key={room._id}>
                            <Card>
                              <Grid container>
                                <Grid item xs={12} md={4}>
                                  <CardMedia
                                    component="img"
                                    height="250"
                                    image={getImageUrl(room.images?.[0])}
                                    alt={room.type}
                                    sx={{ objectFit: 'cover' }}
                                    onError={handleImageError}
                                  />
                                </Grid>
                                <Grid item xs={12} md={8}>
                                  <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                      <Box>
                                        <Typography variant="h6" gutterBottom>
                                          {room.type}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Room {room.roomNumber} • {room.capacity?.adults} Adults, {room.capacity?.children} Children
                                        </Typography>
                                      </Box>
                                      <Typography variant="h6" color="primary">
                                        ETB {room.price} / night
                                      </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                      {room.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                      {room.amenities?.map((amenity, index) => (
                                        <Chip
                                          key={`${room._id}-${amenity}-${index}`}
                                          label={amenity}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                        />
                                      ))}
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Button
                                        variant={selectedRoom?._id === room._id ? "contained" : "outlined"}
                                        color={selectedRoom?._id === room._id ? "primary" : "default"}
                                        onClick={() => handleSelectRoom(room)}
                                        disabled={!room.isAvailable}
                                        sx={{ minWidth: '120px' }}
                                      >
                                        Select Room
                                      </Button>
                                    </Box>
                                  </CardContent>
                                </Grid>
                              </Grid>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Paper>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              {selectedRoom ? 'Complete Your Booking' : 'Select a Room'}
            </Typography>

            {selectedRoom && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selected Room
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2">{selectedRoom.type}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Room {selectedRoom.roomNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRoom.capacity?.adults} Adults, {selectedRoom.capacity?.children} Children
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      ETB {selectedRoom.price} / night
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Dates
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <DatePicker
                          label="Check-in Date"
                          value={bookingForm.checkIn}
                          onChange={(date) => {
                            if (date) {
                              date.setHours(0, 0, 0, 0);
                              setBookingForm(prev => ({ ...prev, checkIn: date }));
                              // Reset check-out date if it's before the new check-in date
                              if (bookingForm.checkOut && date > bookingForm.checkOut) {
                                setBookingForm(prev => ({ ...prev, checkOut: null }));
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
                                  position: 'relative'
                                }}
                                title={!isAvailable ? `Booked until ${new Date(booking?.checkOut).toLocaleDateString()}` : ''}
                              >
                                {dayComponent}
                              </div>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              fullWidth 
                              error={bookingForm.checkIn && !roomAvailability[bookingForm.checkIn.toISOString().split('T')[0]]?.isAvailable}
                              helperText={bookingForm.checkIn && !roomAvailability[bookingForm.checkIn.toISOString().split('T')[0]]?.isAvailable ? 'This date is not available' : ''}
                              sx={DatePickerStyles}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <DatePicker
                          label="Check-out Date"
                          value={bookingForm.checkOut}
                          onChange={(date) => {
                            if (date) {
                              date.setHours(0, 0, 0, 0);
                              if (bookingForm.checkIn && !isDateRangeAvailable(bookingForm.checkIn, date)) {
                                setError('Selected dates are not available. Please choose different dates.');
                                return;
                              }
                              setBookingForm(prev => ({ ...prev, checkOut: date }));
                              setError('');
                            }
                          }}
                          minDate={bookingForm.checkIn || new Date()}
                          shouldDisableDate={(date) => {
                            if (!bookingForm.checkIn) return true;
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
                                  position: 'relative'
                                }}
                                title={!isAvailable ? `Booked until ${new Date(booking?.checkOut).toLocaleDateString()}` : ''}
                              >
                                {dayComponent}
                              </div>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              fullWidth 
                              error={bookingForm.checkOut && !roomAvailability[bookingForm.checkOut.toISOString().split('T')[0]]?.isAvailable}
                              helperText={bookingForm.checkOut && !roomAvailability[bookingForm.checkOut.toISOString().split('T')[0]]?.isAvailable ? 'This date is not available' : ''}
                              sx={DatePickerStyles}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </LocalizationProvider>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Number of Guests
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={bookingForm.guests}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, guests: e.target.value }))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <MenuItem key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Booking Summary
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2">
                      Check-in: {bookingForm.checkIn ? format(bookingForm.checkIn, 'MMM dd, yyyy') : 'Not selected'}
                    </Typography>
                    <Typography variant="body2">
                      Check-out: {bookingForm.checkOut ? format(bookingForm.checkOut, 'MMM dd, yyyy') : 'Not selected'}
                    </Typography>
                    <Typography variant="body2">
                      Guests: {bookingForm.guests}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      Total: ETB {selectedRoom.price * (bookingForm.checkIn && bookingForm.checkOut ? 
                        Math.ceil((bookingForm.checkOut - bookingForm.checkIn) / (1000 * 60 * 60 * 24)) : 1)} 
                    </Typography>
                  </Box>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => {
                    if (!bookingForm.checkIn || !bookingForm.checkOut) {
                      setError('Please select check-in and check-out dates');
                      return;
                    }
                    handleBookNow(selectedRoom);
                  }}
                  disabled={!bookingForm.checkIn || !bookingForm.checkOut}
                >
                  Book Now
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Your Payment</DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <PaymentForm
              bookingDetails={{
                hotelId: hotel._id,
                hotelName: hotel.name,
                hotelLocation: hotel.location.address,
                roomId: selectedRoom._id || selectedRoom.id,
                roomType: selectedRoom.type,
                roomNumber: selectedRoom.roomNumber,
                roomPrice: selectedRoom.price,
                checkIn: bookingForm.checkIn,
                checkOut: bookingForm.checkOut,
                nights: bookingForm.checkIn && bookingForm.checkOut ? 
                  Math.ceil((bookingForm.checkOut - bookingForm.checkIn) / (1000 * 60 * 60 * 24)) : 1,
                guests: bookingForm.guests,
                userId: user?._id || user?.id,
                total: selectedRoom.price * (bookingForm.checkIn && bookingForm.checkOut ? 
                  Math.ceil((bookingForm.checkOut - bookingForm.checkIn) / (1000 * 60 * 60 * 24)) : 1)
              }}
              onSuccess={handleTelebirrPaymentSuccess}
              onCancel={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {showTelebirrDialog && selectedRoomForBooking && (
        <TelebirrPaymentForm
          bookingDetails={{
            hotelId: hotel._id,
            hotelName: hotel.name,
            hotelLocation: hotel.location.address,
            roomId: selectedRoomForBooking._id || selectedRoomForBooking.id,
            roomType: selectedRoomForBooking.type,
            roomNumber: selectedRoomForBooking.roomNumber,
            roomPrice: selectedRoomForBooking.price,
            checkIn: bookingForm.checkIn,
            checkOut: bookingForm.checkOut,
            nights: bookingForm.checkIn && bookingForm.checkOut ? 
              Math.ceil((bookingForm.checkOut - bookingForm.checkIn) / (1000 * 60 * 60 * 24)) : 1,
            guests: bookingForm.guests,
            userId: user?._id || user?.id,
            total: selectedRoomForBooking.price * (bookingForm.checkIn && bookingForm.checkOut ? 
              Math.ceil((bookingForm.checkOut - bookingForm.checkIn) / (1000 * 60 * 60 * 24)) : 1)
          }}
          onSuccess={handleTelebirrPaymentSuccess}
          onCancel={() => setShowTelebirrDialog(false)}
        />
      )}

      {/* Payment Method Selection Dialog */}
      <Dialog
        open={showPaymentMethodDialog}
        onClose={() => setShowPaymentMethodDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Payment Method</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handlePaymentMethodSelect('telebirr')}
              sx={{ mb: 2, p: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/telebirr-logo.png" 
                  alt="Telebirr" 
                  style={{ height: 24, marginRight: 8 }} 
                />
                <Typography>Pay with Telebirr</Typography>
              </Box>
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handlePaymentMethodSelect('card')}
              sx={{ p: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/card-logo.png" 
                  alt="Credit Card" 
                  style={{ height: 24, marginRight: 8 }} 
                />
                <Typography>Pay with Credit Card</Typography>
              </Box>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentMethodDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HotelDetails; 