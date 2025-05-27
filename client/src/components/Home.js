import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  Box,
  Container,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: null,
    checkOut: null,
    guests: 1,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to search results with query parameters
    navigate(`/search?location=${searchParams.location}&checkIn=${searchParams.checkIn}&checkOut=${searchParams.checkOut}&guests=${searchParams.guests}`);
  };

  return (
    <Container maxWidth="md">
      {/* Hero Section */}
      <Box sx={{ 
        height: '60vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Find Your Perfect Stay
        </Typography>
        <Typography variant="h5" gutterBottom>
          Discover amazing hotels and book your next adventure
        </Typography>
      </Box>

      {/* Search Section */}
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find Your Perfect Stay
        </Typography>
        <form onSubmit={handleSearch}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={searchParams.location}
                onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Check-in Date"
                  value={searchParams.checkIn}
                  onChange={(date) => setSearchParams({ ...searchParams, checkIn: date })}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Check-out Date"
                  value={searchParams.checkOut}
                  onChange={(date) => setSearchParams({ ...searchParams, checkOut: date })}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Number of Guests"
                type="number"
                value={searchParams.guests}
                onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
              >
                Search Hotels
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Featured Destinations */}
      <Typography variant="h4" component="h2" gutterBottom>
        Featured Destinations
      </Typography>
      <Grid container spacing={3}>
        {[
          { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80' },
          { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80' },
          { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80' },
        ].map((destination) => (
          <Grid item xs={12} md={4} key={destination.name}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={destination.image}
                alt={destination.name}
              />
              <CardContent>
                <Typography variant="h6" component="h3">
                  {destination.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Home; 