import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { bookingApi } from '../../services/api';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await bookingApi.getById(id);
        setBooking(response.data.data);
      } catch (err) {
        setError('Failed to load booking details');
        console.error('Error fetching booking details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id]);

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/bookings')}
        >
          Back to Bookings
        </Button>
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Booking not found</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/bookings')}
        >
          Back to Bookings
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/bookings')}
        sx={{ mb: 3 }}
      >
        Back to Bookings
      </Button>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Booking Details
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Hotel Information
            </Typography>
            <Typography variant="body1">
              Hotel: {booking.hotel?.name || 'N/A'}
            </Typography>
            <Typography variant="body1">
              Location: {formatAddress(booking.hotel?.address)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Room Information
            </Typography>
            <Typography variant="body1">
              Room Type: {booking.room?.type || 'N/A'}
            </Typography>
            <Typography variant="body1">
              Room Number: {booking.room?.roomNumber || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Booking Period
            </Typography>
            <Typography variant="body1">
              Check-in: {new Date(booking.checkInDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body1">
              Check-out: {new Date(booking.checkOutDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body1">
              Guests: {booking.guests?.adults || 1} Adults, {booking.guests?.children || 0} Children
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Typography variant="body1">
              Total Amount: ETB {booking.totalPrice}
            </Typography>
            <Typography variant="body1">
              Payment Method: {booking.paymentMethod}
            </Typography>
            <Typography variant="body1">
              Payment Status: {booking.paymentStatus}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Booking Status
            </Typography>
            <Typography variant="body1">
              Status: {booking.status}
            </Typography>
            {booking.specialRequests && (
              <Typography variant="body1">
                Special Requests: {booking.specialRequests}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default BookingDetails; 