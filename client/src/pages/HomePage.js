import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Rating,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  CircularProgress,
  Slider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { hotelApi } from '../services/api';
import { useSearch } from '../contexts/SearchContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { searchData, updateSearchData } = useSearch();
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [showAllHotels, setShowAllHotels] = useState(false);
  const [allHotels, setAllHotels] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);

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

  useEffect(() => {
    const fetchFeaturedHotels = async () => {
      try {
        setLoading(true);
        const response = await hotelApi.getFeatured();
        console.log('Featured hotels response:', response);
        if (response.data && response.data.success) {
          setFeaturedHotels(response.data.data);
        } else {
          throw new Error('Failed to fetch featured hotels');
        }
      } catch (error) {
        console.error('Error fetching featured hotels:', error);
        setError('Failed to load featured hotels');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedHotels();

    // Set up an interval to refresh featured hotels every 30 seconds
    const refreshInterval = setInterval(fetchFeaturedHotels, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const handleViewAllHotels = async () => {
    setLoadingAll(true);
    try {
      const response = await hotelApi.getAll();
      setAllHotels(response.data.data);
      setShowAllHotels(true);
    } catch (error) {
      console.error('Error fetching all hotels:', error);
      setError('Failed to load all hotels');
    } finally {
      setLoadingAll(false);
    }
  };

  const handleViewFeatured = () => {
    setShowAllHotels(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      setLoadingAll(true);
      // Get all hotels first
      const response = await hotelApi.getAll();
      let filteredHotels = response.data.data;

      // Filter by name if provided
      if (searchData.name.trim()) {
        const searchTerm = searchData.name.toLowerCase().trim();
        filteredHotels = filteredHotels.filter(hotel => 
          hotel.name.toLowerCase().includes(searchTerm) ||
          (hotel.location?.address && hotel.location.address.toLowerCase().includes(searchTerm))
        );
      }

      // Filter by price range
      filteredHotels = filteredHotels.filter(hotel => {
        const minRoomPrice = hotel.rooms && hotel.rooms.length > 0
          ? Math.min(...hotel.rooms.map(room => room.price))
          : hotel.price;
        return minRoomPrice >= searchData.priceRange[0] && minRoomPrice <= searchData.priceRange[1];
      });

      // Filter by amenities if any are selected
      const selectedAmenities = Object.entries(searchData.amenities)
        .filter(([_, value]) => value)
        .map(([key]) => key);

      if (selectedAmenities.length > 0) {
        filteredHotels = filteredHotels.filter(hotel => 
          selectedAmenities.every(amenity => 
            hotel.amenities && hotel.amenities.includes(amenity)
          )
        );
      }

      // Sort by price (lowest first)
      filteredHotels.sort((a, b) => {
        const aMinPrice = a.rooms && a.rooms.length > 0
          ? Math.min(...a.rooms.map(room => room.price))
          : a.price;
        const bMinPrice = b.rooms && b.rooms.length > 0
          ? Math.min(...b.rooms.map(room => room.price))
          : b.price;
        return aMinPrice - bMinPrice;
      });

      // Update the allHotels state with filtered results
      setAllHotels(filteredHotels);
      setShowAllHotels(true);
      
      // Show message if no hotels found
      if (filteredHotels.length === 0) {
        setError('No hotels found matching your criteria');
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Error searching hotels:', error);
      setError('Failed to search hotels. Please try again.');
    } finally {
      setLoadingAll(false);
    }
  };

  const handleAmenityChange = (amenity) => {
    updateSearchData({
      amenities: {
        ...searchData.amenities,
        [amenity]: !searchData.amenities[amenity]
      }
    });
  };

  const handlePriceChange = (event, newValue) => {
    updateSearchData({
      priceRange: newValue
    });
  };

  const handleFavoriteClick = (hotelId, event) => {
    event.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(hotelId)) {
        newFavorites.delete(hotelId);
      } else {
        newFavorites.add(hotelId);
      }
      return newFavorites;
    });
  };

  const handleNameChange = (e) => {
    updateSearchData({
      name: e.target.value
    });
  };

  const amenityLabels = {
    wifi: 'WiFi',
    parking: 'Parking',
    pool: 'Swimming Pool',
    restaurant: 'Restaurant',
    gym: 'Fitness Center',
    spa: 'Spa',
    bar: 'Bar',
    concierge: 'Concierge',
    room_service: '24/7 Room Service',
    laundry: 'Laundry Service',
    business_center: 'Business Center',
    meeting_rooms: 'Meeting Rooms'
  };

  const renderFeaturedHotel = (hotel) => {
    const minRoomPrice = hotel.rooms && hotel.rooms.length > 0
      ? Math.min(...hotel.rooms.map(room => room.price))
      : hotel.price;

    return (
      <Grid item xs={12} sm={6} md={4} key={hotel._id}>
        <Card 
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            cursor: 'pointer',
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-4px)',
              transition: 'all 0.3s ease'
            }
          }}
          onClick={() => navigate(`/hotels/${hotel._id}`)}
        >
          <CardMedia
            component="img"
            height="200"
            image={getImageUrl(hotel.images?.[0])}
            alt={hotel.name}
            onError={handleImageError}
          />
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {hotel.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                  {hotel.location?.address || 'Address not available'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating value={hotel.rating || 0} precision={0.5} readOnly size="small" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({hotel.rating || 0})
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                From {minRoomPrice || 0} ETB / night
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {hotel.amenities?.slice(0, 4).map((amenity, index) => (
                <Chip
                  key={index}
                  label={amenity}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
              {hotel.amenities?.length > 4 && (
                <Chip
                  label={`+${hotel.amenities.length - 4} more`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/hotels/${hotel._id}`);
                }}
              >
                View Details
              </Button>
              <IconButton
                onClick={(e) => handleFavoriteClick(hotel._id, e)}
                color={favorites.has(hotel._id) ? 'primary' : 'default'}
              >
                {favorites.has(hotel._id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box>
      {/* Hero Section with Search */}
      <Box
        sx={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/images/hotel-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          py: 10,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" component="h1" gutterBottom>
              Find Your Perfect Stay In DeberBrhan Ethiopia
            </Typography>
            <Typography variant="h5" sx={{ mb: 4 }}>
              በደብረብርሃን፣ ኢትዮጵያ ውስጥ ምቹ ማረፊያ ያግኙ
            </Typography>
          </Box>

          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <form onSubmit={handleSearch}>
              <Grid container spacing={1}>
                {/* Main Search Bar */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Search Hotels by Name or Location"
                    variant="outlined"
                    value={searchData.name}
                    onChange={handleNameChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loadingAll}
                            size="small"
                            sx={{ 
                              borderRadius: 1,
                              px: 2,
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: 2
                              }
                            }}
                          >
                            {loadingAll ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              'Search'
                            )}
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Enter hotel name or location..."
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        fontSize: '0.9rem',
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                          transition: 'all 0.2s ease-in-out'
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: '1px'
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: '1px'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.9rem'
                      }
                    }}
                  />
                </Grid>

                {/* Price Range Slider */}
                <Grid item xs={12}>
                  <Box sx={{ px: 1, py: 0.5 }}>
                    <Typography gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      Price Range (ETB)
                    </Typography>
                    <Slider
                      value={searchData.priceRange}
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
                      size="small"
                      sx={{
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 6px rgba(25, 118, 210, 0.16)'
                          }
                        },
                        '& .MuiSlider-track': {
                          height: 3
                        },
                        '& .MuiSlider-rail': {
                          height: 3
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {searchData.priceRange[0]} ETB
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {searchData.priceRange[1]} ETB
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Amenities Selection */}
                <Grid item xs={12}>
                  <Typography gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    Amenities
                  </Typography>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1, 
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 1
                    }}
                  >
                    <Grid container spacing={1}>
                      {Object.entries(amenityLabels).map(([key, label]) => (
                        <Grid item xs={6} sm={4} md={3} key={key}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={searchData.amenities[key]}
                                onChange={() => handleAmenityChange(key)}
                                color="primary"
                                size="small"
                                sx={{
                                  '&.Mui-checked': {
                                    color: 'primary.main'
                                  }
                                }}
                              />
                            }
                            label={label}
                            sx={{
                              '& .MuiFormControlLabel-label': {
                                fontSize: '0.8rem',
                                color: 'text.secondary'
                              }
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>
      </Box>

      {/* Featured Hotels Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h2">
            {showAllHotels ? 'All Hotels' : 'Featured Hotels'}
          </Typography>
          {!showAllHotels ? (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleViewAllHotels}
              disabled={loadingAll}
              startIcon={loadingAll ? <CircularProgress size={20} /> : null}
            >
              {loadingAll ? 'Loading...' : 'View All Hotels'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleViewFeatured}
            >
              View Featured Hotels
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {(showAllHotels ? allHotels : featuredHotels).map(renderFeaturedHotel)}
          </Grid>
        )}
      </Container>

      {/* Why Choose Us Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 6, textAlign: 'center' }}>
            Why Choose Us
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  Best Price Guarantee
                </Typography>
                <Typography color="text.secondary">
                  We guarantee the best prices for all our hotels. If you find a lower price elsewhere, we'll match it!
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  Easy Booking
                </Typography>
                <Typography color="text.secondary">
                  Simple and secure booking process. Book your stay in just a few clicks!
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  24/7 Support
                </Typography>
                <Typography color="text.secondary">
                  Our customer support team is available around the clock to assist you with any queries.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage; 