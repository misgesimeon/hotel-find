import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { bookingApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const steps = ['Enter Phone', 'Confirm Payment', 'Verify SMS', 'Complete'];

const TelebirrPaymentForm = ({ bookingDetails, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(bookingDetails);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (bookingDetails) {
      setBooking(bookingDetails);
    }
  }, [bookingDetails]);

  const validatePhoneNumber = (phone) => {
    const ethiopianPhoneRegex = /^(\+251|0)(9|7)[0-9]{8}$/;
    return ethiopianPhoneRegex.test(phone);
  };

  const handlePhoneSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Ethiopian phone number (e.g., +2519XXXXXXXX or 09XXXXXXXX)');
      return;
    }

    setActiveStep(1);
  };

  const handleConfirmPayment = () => {
    setActiveStep(2);
  };

  const handleVerifySms = async () => {
    try {
      if (!smsCode.trim()) {
        setError('Please enter the verification code');
        return;
      }

      // Log the booking details for debugging
      console.log('Full booking details:', booking);
      console.log('Current user:', user);

      if (!user?._id) {
        throw new Error('Please log in to complete your booking');
      }

      // Format dates without timezone conversion
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      const checkInDate = formatDate(booking.checkIn);
      const checkOutDate = formatDate(booking.checkOut);

      // Validate dates
      if (!checkInDate || !checkOutDate) {
        throw new Error('Invalid dates provided');
      }

      // Create booking with all required fields
      const bookingData = {
        hotel: booking.hotelId,
        room: booking.roomId,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        guests: {
          adults: parseInt(booking.guests) || 1,
          children: 0
        },
        user: user._id,
        totalPrice: parseFloat(booking.total),
        paymentMethod: 'bank_transfer',
        status: 'confirmed',
        paymentStatus: 'paid',
        phoneNumber: phoneNumber,
        customerName: user.name || 'Guest',
        customerEmail: user.email,
        customerIdNumber: user.idNumber || 'TEMP-ID-' + Date.now(),
        specialRequests: 'Payment via Telebirr'
      };

      // Validate all required fields
      if (!bookingData.hotel || !bookingData.room || !bookingData.checkInDate || 
          !bookingData.checkOutDate || !bookingData.user || !bookingData.totalPrice) {
        throw new Error('Missing required booking information');
      }

      console.log('Creating booking with data:', bookingData);

      // Create the booking with proper error handling
      let response;
      try {
        response = await bookingApi.create(bookingData);
      } catch (apiError) {
        console.error('API Error:', apiError);
        console.error('API Error Response:', apiError.response?.data);
        throw new Error(apiError.response?.data?.message || 'Failed to create booking');
      }

      // Validate response
      if (!response || !response.data) {
        console.error('Invalid API response:', response);
        throw new Error('Invalid response from server');
      }

      // Get the booking ID from the response
      const bookingId = response.data.data?._id || response.data._id;
      if (!bookingId) {
        console.error('No booking ID in response:', response.data);
        throw new Error('No booking ID received from server');
      }

      console.log('Booking created successfully:', response.data);

      // Set payment response with booking ID
      setPaymentDetails({
        success: true,
        bookingId: bookingId,
        paymentId: 'telebirr-' + Date.now(),
        message: 'Payment Successful!'
      });

      // Move to complete step
      setActiveStep(3);

      // Call onSuccess callback with the booking ID
      if (onSuccess) {
        onSuccess({
          bookingId: bookingId,
          success: true,
          message: 'Payment Successful!'
        });
      }

      // Navigate to the booking details page
      navigate(`/bookings/${bookingId}`);
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.message === 'Please log in to complete your booking') {
        setError('Please log in to complete your booking');
      } else if (error.message === 'Invalid dates provided' || 
                 error.message === 'Missing required booking information') {
        setError(error.message);
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Room is not available';
        setError(`${errorMessage}. Please try a different room or dates.`);
      } else {
        setError(error.message || 'Failed to create booking. Please try again.');
      }
    }
  };

  const handleViewBooking = () => {
    navigate('/bookings');
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" onSubmit={handlePhoneSubmit} sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Please enter your Telebirr-registered phone number to complete the payment.
            </Typography>
            <TextField
              fullWidth
              label="Phone Number"
              variant="outlined"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+2519XXXXXXXX or 09XXXXXXXX"
              sx={{ mt: 2 }}
              required
              error={!!error}
              helperText={error}
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Confirm Payment Details
            </Typography>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mt: 2,
                bgcolor: '#F4F5F7',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hotel Details
                </Typography>
                <Typography variant="body1">
                  Hotel: {booking.hotelName}
                </Typography>
                <Typography variant="body1">
                  Location: {booking.hotelLocation}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Room Details
                </Typography>
                <Typography variant="body1">
                  Room Type: {booking.roomType}
                </Typography>
                <Typography variant="body1">
                  Price per Night: ETB {booking.roomPrice}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Booking Period
                </Typography>
                <Typography variant="body1">
                  Check-in: {new Date(booking.checkIn).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  Check-out: {new Date(booking.checkOut).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  Nights: {booking.nights}
                </Typography>
                <Typography variant="body1">
                  Guests: {booking.guests}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Payment Details
                </Typography>
                <Typography variant="body1">
                  Total Amount: ETB {booking.total}
                </Typography>
                <Typography variant="body1">
                  Phone Number: {phoneNumber}
                </Typography>
                <Typography variant="body1">
                  Payment Method: Telebirr
                </Typography>
              </Box>
            </Paper>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Verify Payment
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Please enter the 6-digit verification code sent to your phone number {phoneNumber}
            </Typography>
            <TextField
              fullWidth
              label="Verification Code"
              variant="outlined"
              value={smsCode}
              onChange={(e) => {
                setSmsCode(e.target.value);
              }}
              placeholder="Enter 6-digit code"
              inputProps={{ maxLength: 6 }}
              error={!!error}
              helperText={error}
              sx={{ mb: 3 }}
            />
            <Button
              variant="text"
              color="primary"
              onClick={() => {
                // Simulate resending code
                setSmsCode('');
              }}
            >
              Resend Code
            </Button>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="success.main">
                Payment Successful!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Your payment has been processed successfully.
              </Typography>
              {paymentDetails?.error && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Note: {paymentDetails.error}. Please contact the hotel for assistance.
                  </Typography>
                </Alert>
              )}
            </Box>

            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 3,
                bgcolor: '#F4F5F7',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Booking Details
                </Typography>
                <Typography variant="body1">
                  Hotel: {booking.hotelName}
                </Typography>
                <Typography variant="body1">
                  Location: {booking.hotelLocation}
                </Typography>
                <Typography variant="body1">
                  Room Type: {booking.roomType}
                </Typography>
                <Typography variant="body1">
                  Check-in: {new Date(booking.checkIn).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  Check-out: {new Date(booking.checkOut).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  Guests: {booking.guests}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Payment Details
                </Typography>
                <Typography variant="body1">
                  Amount: ETB {booking.total}
                </Typography>
                <Typography variant="body1">
                  Payment Method: Telebirr
                </Typography>
                <Typography variant="body1">
                  Phone Number: {phoneNumber}
                </Typography>
                <Typography variant="body1">
                  Transaction ID: {paymentDetails?.paymentId || 'simulated-' + Date.now()}
                </Typography>
                <Typography variant="body1">
                  Status: Completed
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                What's Next?
              </Typography>
              <Typography variant="body2">
                • You will receive a confirmation email with your booking details
              </Typography>
              <Typography variant="body2">
                • Present your booking confirmation at the hotel reception
              </Typography>
              <Typography variant="body2">
                • Contact us if you need any assistance
              </Typography>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleViewBooking}
                sx={{
                  bgcolor: '#1A73E8',
                  '&:hover': {
                    bgcolor: '#1557B0'
                  }
                }}
              >
                View My Booking
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={true} 
      onClose={onCancel} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F5F7'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#1A73E8', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">Pay with Telebirr</Typography>
        <IconButton 
          onClick={onCancel} 
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {getStepContent(activeStep)}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#F4F5F7' }}>
        {activeStep === 0 && (
          <Button
            onClick={handlePhoneSubmit}
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              bgcolor: '#1A73E8',
              '&:hover': {
                bgcolor: '#1557B0'
              }
            }}
          >
            Continue to Payment
          </Button>
        )}
        {activeStep === 1 && (
          <Box sx={{ width: '100%', display: 'flex', gap: 2 }}>
            <Button
              onClick={() => setActiveStep(0)}
              variant="outlined"
              fullWidth
              sx={{
                borderColor: '#1A73E8',
                color: '#1A73E8',
                '&:hover': {
                  borderColor: '#1557B0',
                  color: '#1557B0'
                }
              }}
            >
              Back
            </Button>
            <Button
              onClick={handleConfirmPayment}
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                bgcolor: '#1A73E8',
                '&:hover': {
                  bgcolor: '#1557B0'
                }
              }}
            >
              Confirm Payment
            </Button>
          </Box>
        )}
        {activeStep === 2 && (
          <Box sx={{ width: '100%', display: 'flex', gap: 2 }}>
            <Button
              onClick={() => setActiveStep(1)}
              variant="outlined"
              fullWidth
              sx={{
                borderColor: '#1A73E8',
                color: '#1A73E8',
                '&:hover': {
                  borderColor: '#1557B0',
                  color: '#1557B0'
                }
              }}
            >
              Back
            </Button>
            <Button
              onClick={handleVerifySms}
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                bgcolor: '#1A73E8',
                '&:hover': {
                  bgcolor: '#1557B0'
                }
              }}
            >
              Verify Code
            </Button>
          </Box>
        )}
        {activeStep === 3 && (
          <Button
            onClick={onCancel}
            variant="outlined"
            fullWidth
            sx={{
              borderColor: '#1A73E8',
              color: '#1A73E8',
              '&:hover': {
                borderColor: '#1557B0',
                color: '#1557B0'
              }
            }}
          >
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TelebirrPaymentForm; 