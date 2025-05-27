import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const BookingHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [cancelDialog, setCancelDialog] = useState({ open: false, bookingId: null });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await bookingApi.getAll();
        if (response.data && response.data.success) {
          // Filter bookings for the current user
          const userBookings = response.data.data.filter(booking => 
            booking.user === user._id
          );
          setBookings(userBookings);
        } else {
          setError(response.data?.message || 'Failed to fetch bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError(error.response?.data?.message || 'Failed to fetch bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const getStatusChip = (status) => {
    const statusColors = {
      confirmed: 'success',
      pending: 'warning',
      cancelled: 'error',
      completed: 'info',
    };

    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={statusColors[status]}
        size="small"
        sx={{ ml: 1 }}
      />
    );
  };

  const getPaymentStatusChip = (status) => {
    const statusColors = {
      paid: 'success',
      pending: 'warning',
      failed: 'error',
      refunded: 'info',
    };

    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={statusColors[status]}
        size="small"
        sx={{ ml: 1 }}
      />
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    if (tabValue === 0) return true; // All bookings
    if (tabValue === 1) return booking.status === 'confirmed';
    if (tabValue === 2) return booking.status === 'pending';
    if (tabValue === 3) return booking.status === 'cancelled';
    if (tabValue === 4) return booking.status === 'completed';
    return true;
  });

  const handleCancelBooking = async (bookingId) => {
    setCancelDialog({ open: true, bookingId });
  };

  const confirmCancelBooking = async () => {
    try {
      const response = await bookingApi.cancel(cancelDialog.bookingId);
      if (response.data && response.data.success) {
        setBookings(bookings.map(b => 
          b._id === cancelDialog.bookingId ? { ...b, status: 'cancelled' } : b
        ));
        setSnackbar({
          open: true,
          message: 'Booking cancelled successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: response.data?.message || 'Failed to cancel booking',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to cancel booking. Please try again later.',
        severity: 'error'
      });
    } finally {
      setCancelDialog({ open: false, bookingId: null });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Bookings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" />
          <Tab label="Confirmed" />
          <Tab label="Pending" />
          <Tab label="Cancelled" />
          <Tab label="Completed" />
        </Tabs>

        <Grid container spacing={3}>
          {filteredBookings.map((booking) => (
            <Grid item xs={12} key={booking._id}>
              <Card elevation={2}>
                <Grid container>
                  <Grid item xs={12} md={4}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={booking.hotel?.images?.[0] || '/default-hotel.jpg'}
                      alt={booking.hotel?.name || 'Hotel'}
                      sx={{ objectFit: 'cover' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" gutterBottom>
                          {booking.hotel?.name || 'Unknown Hotel'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {getStatusChip(booking.status)}
                          {getPaymentStatusChip(booking.paymentStatus)}
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {booking.hotel?.address ? (
                          <>
                            {booking.hotel.address.street && `${booking.hotel.address.street}, `}
                            {booking.hotel.address.city && `${booking.hotel.address.city}, `}
                            {booking.hotel.address.state && `${booking.hotel.address.state} `}
                            {booking.hotel.address.zipCode && `${booking.hotel.address.zipCode}, `}
                            {booking.hotel.address.country}
                          </>
                        ) : 'Address not available'}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Room Type:</strong> {booking.room?.type || 'Unknown Room Type'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Check-in:</strong> {format(new Date(booking.checkInDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Check-out:</strong> {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Total Price:</strong> ETB {booking.totalPrice?.toFixed(2) || '0.00'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Booking ID:</strong> {booking._id}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/hotels/${booking.hotel?._id}`)}
                          disabled={!booking.hotel?._id}
                        >
                          View Hotel
                        </Button>
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleCancelBooking(booking._id)}
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
          {filteredBookings.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>No bookings found</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, bookingId: null })}
      >
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, bookingId: null })}>
            No, Keep Booking
          </Button>
          <Button onClick={confirmCancelBooking} color="error" autoFocus>
            Yes, Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingHistory; 