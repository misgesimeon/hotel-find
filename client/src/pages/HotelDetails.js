import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Rating,
  Divider,
  IconButton,
  Alert,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WifiIcon from '@mui/icons-material/Wifi';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PoolIcon from '@mui/icons-material/Pool';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SpaIcon from '@mui/icons-material/Spa';
import { hotelApi } from '../services/api';
import { ImageComponent } from '../utils/imageUtils';

const amenityIcons = {
  wifi: <WifiIcon />,
  parking: <LocalParkingIcon />,
  pool: <PoolIcon />,
  restaurant: <RestaurantIcon />,
  gym: <FitnessCenterIcon />,
  spa: <SpaIcon />,
};

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchHotelDetails = async () => {
      if (!id) {
        setError('Hotel ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await hotelApi.getById(id);
        
        if (!isMounted) return;

        if (!response?.data?.success || !response?.data?.data) {
          throw new Error('Invalid response from server');
        }

        setHotel(response.data.data);
      } catch (err) {
        if (!isMounted) return;
        
        setError(err.response?.data?.message || 'Failed to load hotel details');
        console.error('Error fetching hotel details:', err);
      } finally {
        if (isMounted) {
        setLoading(false);
        }
      }
    };

    fetchHotelDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Box>
    );
  }

  if (!hotel || !hotel._id) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>Hotel not found</Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Box>
    );
  }

  const handleBookNow = () => {
    if (hotel?._id) {
      navigate(`/booking/${hotel._id}`);
  }
  };

  return (
    <Box sx={{ bgcolor: '#FFF7E6', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ position: 'relative', height: '400px' }}>
        <ImageComponent
          src={hotel.image}
          alt={hotel.name}
          style={{
            width: '100%',
            height: '400px',
            objectFit: 'cover'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 4,
          }}
        >
          <IconButton
            onClick={() => navigate('/')}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
            {hotel.name}
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            <LocationOnIcon sx={{ mr: 1 }} />
            {hotel.location?.address || 'Address not available'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating value={hotel.rating || 0} readOnly precision={0.5} sx={{ color: 'white' }} />
            <Typography variant="body1" sx={{ color: 'white', ml: 1 }}>
              ({hotel.reviews || 0} reviews)
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
            {hotel.price || 0} ETB / night
          </Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ py: 6, px: 2 }}>
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                About This Hotel
              </Typography>
              <Typography variant="body1" paragraph>
                {hotel.description || 'No description available'}
              </Typography>
            </Paper>

            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Amenities
              </Typography>
              <Grid container spacing={2}>
                {hotel.amenities?.map((amenity, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {amenityIcons[amenity] || <WifiIcon />}
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
                {(!hotel.amenities || hotel.amenities.length === 0) && (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary">
                      No amenities listed
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, position: 'sticky', top: 20 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Book Your Stay
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleBookNow}
                disabled={!hotel?._id}
              >
                Book Now
              </Button>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Check-in: {hotel.checkInTime || '2:00 PM'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check-out: {hotel.checkOutTime || '12:00 PM'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Cancellation Policy: {hotel.policies?.cancellation || 'Free cancellation up to 24 hours before check-in'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default HotelDetails; 