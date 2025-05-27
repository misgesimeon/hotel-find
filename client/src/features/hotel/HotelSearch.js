import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Slider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import WifiIcon from '@mui/icons-material/Wifi';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PoolIcon from '@mui/icons-material/Pool';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SpaIcon from '@mui/icons-material/Spa';
import { hotelApi } from '../../services/api';

const HotelSearch = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location: '',
    checkIn: null,
    checkOut: null,
    guests: 1,
    priceRange: [0, 10000],
    amenities: {
      wifi: false,
      parking: false,
      pool: false,
      restaurant: false,
      gym: false,
      spa: false,
    },
    sortBy: 'price',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate form data
      if (!formData.location) {
        throw new Error('Please enter a location');
      }
      
      if (formData.checkIn && formData.checkOut && formData.checkIn > formData.checkOut) {
        throw new Error('Check-out date must be after check-in date');
      }
      
      // Construct search parameters
      const searchParams = {
        location: formData.location,
        checkIn: formData.checkIn ? formData.checkIn.toISOString().split('T')[0] : '',
        checkOut: formData.checkOut ? formData.checkOut.toISOString().split('T')[0] : '',
        guests: formData.guests,
        minPrice: formData.priceRange[0],
        maxPrice: formData.priceRange[1],
        amenities: Object.entries(formData.amenities)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(','),
        sortBy: formData.sortBy
      };
      
      console.log('Search Parameters:', searchParams);
      
      // Make API call to search hotels
      const response = await hotelApi.search(searchParams);
      console.log('Search Response:', response.data);
      
      if (!response.data.data || response.data.data.length === 0) {
        throw new Error('No hotels found matching your criteria');
      }
      
      // Navigate to search results with the search parameters
      navigate('/search', { 
        state: { 
          searchParams,
          hotels: response.data.data
        }
      });
    } catch (error) {
      console.error('Error searching hotels:', error);
      setError(error.message || 'Failed to search hotels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityChange = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity]
      }
    }));
  };

  const handlePriceChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      priceRange: newValue
    }));
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find Your Perfect Stay
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                placeholder="Enter city, region, or hotel name"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Check-in"
                  value={formData.checkIn}
                  onChange={(date) => setFormData({ ...formData, checkIn: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Check-out"
                  value={formData.checkOut}
                  onChange={(date) => setFormData({ ...formData, checkOut: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={formData.checkIn || new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Guests"
                type="number"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 10 }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Price Range (ETB)</Typography>
              <Slider
                value={formData.priceRange}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={100}
                marks={[
                  { value: 0, label: '0 ETB' },
                  { value: 5000, label: '5000 ETB' },
                  { value: 10000, label: '10000 ETB' }
                ]}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {formData.priceRange[0]} ETB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.priceRange[1]} ETB
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Amenities</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Button
                    variant={formData.amenities.wifi ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                    onClick={() => handleAmenityChange('wifi')}
                    startIcon={<WifiIcon />}
                  >
                    WiFi
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Button
                    variant={formData.amenities.parking ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                    onClick={() => handleAmenityChange('parking')}
                    startIcon={<LocalParkingIcon />}
                  >
                    Parking
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Button
                    variant={formData.amenities.pool ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                    onClick={() => handleAmenityChange('pool')}
                    startIcon={<PoolIcon />}
                  >
                    Pool
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Button
                    variant={formData.amenities.restaurant ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                    onClick={() => handleAmenityChange('restaurant')}
                    startIcon={<RestaurantIcon />}
                  >
                    Restaurant
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Button
                    variant={formData.amenities.gym ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                    onClick={() => handleAmenityChange('gym')}
                    startIcon={<FitnessCenterIcon />}
                  >
                    Gym
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Button
                    variant={formData.amenities.spa ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                    onClick={() => handleAmenityChange('spa')}
                    startIcon={<SpaIcon />}
                  >
                    Spa
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={formData.sortBy}
                  label="Sort By"
                  onChange={(e) => setFormData({ ...formData, sortBy: e.target.value })}
                >
                  <MenuItem value="price">Price (Low to High)</MenuItem>
                  <MenuItem value="rating">Rating (High to Low)</MenuItem>
                  <MenuItem value="distance">Distance from City Center</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search Hotels'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default HotelSearch; 