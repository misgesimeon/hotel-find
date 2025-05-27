import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Rating,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Paper,
  CircularProgress,
  Tooltip,
  IconButton,
  Pagination,
  Chip
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import WifiIcon from '@mui/icons-material/Wifi';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PoolIcon from '@mui/icons-material/Pool';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';
import { hotelApi } from '../../services/api';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    rating: 0,
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

  const hotelsPerPage = 6;

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        
        // Get search parameters from location state
        const { searchParams, hotels: initialHotels } = location.state || {};
        
        if (initialHotels) {
          setHotels(initialHotels);
        } else if (searchParams) {
          // If no initial hotels, fetch using search parameters
          const response = await hotelApi.search(searchParams);
          setHotels(response.data.data);
        }
        
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch hotels. Please try again later.');
        console.error('Error fetching hotels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [location.state]);

  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }));
    setCurrentPage(1);
  };

  const handleAmenityChange = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity]
      }
    }));
    setCurrentPage(1);
  };

  const handleHotelClick = (hotelId) => {
    navigate(`/hotel/${hotelId}`, {
      state: {
        checkIn: location.state?.searchParams?.checkIn,
        checkOut: location.state?.searchParams?.checkOut,
        guests: location.state?.searchParams?.guests,
      }
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

  const filteredHotels = hotels
    .filter((hotel) =>
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.location.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((hotel) => {
      if (filters.rating > 0 && hotel.rating < filters.rating) return false;
      
      const minRoomPrice = hotel.rooms && hotel.rooms.length > 0
        ? Math.min(...hotel.rooms.map(room => room.price))
        : hotel.price;
      const maxRoomPrice = hotel.rooms && hotel.rooms.length > 0
        ? Math.max(...hotel.rooms.map(room => room.price))
        : hotel.price;
        
      if (minRoomPrice < filters.priceRange[0] || maxRoomPrice > filters.priceRange[1]) return false;
      
      if (filters.amenities.wifi && !hotel.amenities.includes('wifi')) return false;
      if (filters.amenities.parking && !hotel.amenities.includes('parking')) return false;
      if (filters.amenities.pool && !hotel.amenities.includes('pool')) return false;
      if (filters.amenities.restaurant && !hotel.amenities.includes('restaurant')) return false;
      if (filters.amenities.gym && !hotel.amenities.includes('gym')) return false;
      if (filters.amenities.spa && !hotel.amenities.includes('spa')) return false;
      
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          const aMinPrice = a.rooms && a.rooms.length > 0
            ? Math.min(...a.rooms.map(room => room.price))
            : a.price;
          const bMinPrice = b.rooms && b.rooms.length > 0
            ? Math.min(...b.rooms.map(room => room.price))
            : b.price;
          return aMinPrice - bMinPrice;
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          return a.distance - b.distance;
        default:
          return 0;
      }
    });

  const indexOfLastHotel = currentPage * hotelsPerPage;
  const indexOfFirstHotel = indexOfLastHotel - hotelsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirstHotel, indexOfLastHotel);
  const totalPages = Math.ceil(filteredHotels.length / hotelsPerPage);

  const renderHotelCard = (hotel) => {
    const minRoomPrice = hotel.rooms && hotel.rooms.length > 0
      ? Math.min(...hotel.rooms.map(room => room.price))
      : hotel.price;
    const maxRoomPrice = hotel.rooms && hotel.rooms.length > 0
      ? Math.max(...hotel.rooms.map(room => room.price))
      : hotel.price;

    return (
      <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} key={hotel._id}>
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
          onClick={() => handleHotelClick(hotel._id)}
        >
          <CardMedia
            component="img"
            height="200"
            image={hotel.image}
            alt={hotel.name}
          />
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {hotel.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                  {hotel.location.address}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating value={hotel.rating} precision={0.5} readOnly size="small" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({hotel.rating})
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Price Range: {minRoomPrice} - {maxRoomPrice} ETB / night
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
                  handleHotelClick(hotel._id);
                }}
              >
                View Details
              </Button>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavoriteClick(hotel._id, e);
                }}
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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Search Results
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Grid View">
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
              >
                <ListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
              >
                <MapIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search hotels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 4 }}
        />
        
        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Filters
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom sx={{ fontWeight: 500 }}>Price Range</Typography>
                <Slider
                  value={filters.priceRange}
                  onChange={(_, value) => handleFilterChange('priceRange', value)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={10000}
                  step={50}
                  valueLabelFormat={(value) => `$${value}`}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom sx={{ fontWeight: 500 }}>Rating</Typography>
                <Rating
                  value={filters.rating}
                  onChange={(_, value) => handleFilterChange('rating', value)}
                  icon={<StarIcon fontSize="inherit" />}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom sx={{ fontWeight: 500 }}>Amenities</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.amenities.wifi}
                        onChange={() => handleAmenityChange('wifi')}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WifiIcon sx={{ mr: 1 }} />
                        WiFi
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.amenities.parking}
                        onChange={() => handleAmenityChange('parking')}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalParkingIcon sx={{ mr: 1 }} />
                        Parking
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.amenities.pool}
                        onChange={() => handleAmenityChange('pool')}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PoolIcon sx={{ mr: 1 }} />
                        Pool
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.amenities.restaurant}
                        onChange={() => handleAmenityChange('restaurant')}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <RestaurantIcon sx={{ mr: 1 }} />
                        Restaurant
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.amenities.gym}
                        onChange={() => handleAmenityChange('gym')}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <RestaurantIcon sx={{ mr: 1 }} />
                        Gym
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.amenities.spa}
                        onChange={() => handleAmenityChange('spa')}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <RestaurantIcon sx={{ mr: 1 }} />
                        Spa
                      </Box>
                    }
                  />
                </FormGroup>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="price">Price (Low to High)</MenuItem>
                  <MenuItem value="rating">Rating (High to Low)</MenuItem>
                  <MenuItem value="distance">Distance from City Center</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Hotel Results */}
          <Grid item xs={12} md={9}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" color="text.secondary">
                Showing {filteredHotels.length} hotels
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {currentHotels.map((hotel) => renderHotelCard(hotel))}
            </Grid>
            {filteredHotels.length === 0 && (
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No hotels found matching your search criteria
                </Typography>
                <Typography color="text.secondary">
                  Try adjusting your filters or search query
                </Typography>
              </Paper>
            )}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, value) => setCurrentPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default SearchResults; 