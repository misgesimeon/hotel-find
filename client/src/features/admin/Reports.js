import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  IconButton,
  InputAdornment,
  Stack,
  Button,
  Chip,
  Autocomplete,
  TablePagination,
} from '@mui/material';
import {
  People as PeopleIcon,
  Hotel as HotelIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { bookingApi, hotelApi, authApi } from '../../services/api';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState({
    userName: '',
    email: '',
    hotelId: '',
    startDate: null,
    endDate: null,
    createdAt: null,
  });
  const [hotels, setHotels] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHotels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    bookingStats: {
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    },
    revenueStats: {
      daily: 0,
      weekly: 0,
      monthly: 0,
    },
    userStats: {
      regular: 0,
      hotelManagers: 0,
      admins: 0,
    },
    recentBookings: [],
  });

  const cacheRef = useRef({
    users: null,
    hotels: null,
    bookings: null,
    rooms: new Map(), // Cache for rooms by hotel ID
    lastFetch: null
  });

  // Helper function to handle rate limiting with exponential backoff
  const fetchWithRetry = useCallback(async (apiCall, maxRetries = 3, initialDelay = 1000) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await apiCall();
        return response;
      } catch (error) {
        if (error.status === 429 && retries < maxRetries) {
          const delay = initialDelay * Math.pow(2, retries); // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          continue;
        }
        throw error;
      }
    }
  }, []);

  // Helper function to get rooms for a hotel with caching
  const getHotelRooms = useCallback(async (hotelId) => {
    try {
      // Check cache first
      if (cacheRef.current.rooms.has(hotelId)) {
        const cachedData = cacheRef.current.rooms.get(hotelId);
        if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) { // 5 minutes cache
          return cachedData.rooms;
        }
      }

      // Fetch fresh data if cache is invalid
      const response = await fetchWithRetry(() => hotelApi.getHotelRooms(hotelId));
      if (!response.data.success) {
        throw new Error('Failed to fetch rooms');
      }

      // Update cache
      cacheRef.current.rooms.set(hotelId, {
        rooms: response.data.data,
        timestamp: Date.now()
      });

      return response.data.data;
    } catch (error) {
      console.error(`Error fetching rooms for hotel ${hotelId}:`, error);
      return [];
    }
  }, [fetchWithRetry]);

  // Fetch initial stats with caching
  useEffect(() => {
    const fetchInitialStats = async () => {
      try {
        setLoading(true);
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

        // Check cache first
        if (cacheRef.current.lastFetch && (now - cacheRef.current.lastFetch < CACHE_DURATION)) {
          const { users, hotels, bookings } = cacheRef.current;
          if (users && hotels && bookings) {
            processAndSetData(users, hotels, bookings);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data if cache is invalid
        const [usersResponse, hotelsResponse, bookingsResponse] = await Promise.all([
          fetchWithRetry(() => authApi.getUsers()),
          fetchWithRetry(() => hotelApi.getAll()),
          fetchWithRetry(() => bookingApi.getAll())
        ]);

        if (!usersResponse.data.success || !hotelsResponse.data.success || !bookingsResponse.data.success) {
          throw new Error('Failed to fetch data from one or more endpoints');
        }

        // Update cache
        cacheRef.current = {
          ...cacheRef.current,
          users: usersResponse.data.data,
          hotels: hotelsResponse.data.data,
          bookings: bookingsResponse.data.data,
          lastFetch: now
        };

        processAndSetData(
          usersResponse.data.data,
          hotelsResponse.data.data,
          bookingsResponse.data.data
        );

        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial stats:', error);
        setError(error.response?.data?.message || 'Failed to fetch statistics');
        setLoading(false);
      }
    };

    const processAndSetData = (users, hotelsData, bookings) => {
      const sortedHotels = hotelsData.sort((a, b) => a.name.localeCompare(b.name));
      
      const bookingStats = {
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        completed: bookings.filter(b => b.status === 'completed').length,
      };

      const now = new Date();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const revenueStats = {
        daily: bookings
          .filter(b => new Date(b.createdAt) > oneDayAgo && (b.status === 'confirmed' || b.status === 'completed'))
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        weekly: bookings
          .filter(b => new Date(b.createdAt) > oneWeekAgo && (b.status === 'confirmed' || b.status === 'completed'))
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        monthly: bookings
          .filter(b => new Date(b.createdAt) > oneMonthAgo && (b.status === 'confirmed' || b.status === 'completed'))
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      };

      const userStats = {
        regular: users.filter(u => u.role === 'user').length,
        hotelManagers: users.filter(u => u.role === 'hotel_manager').length,
        admins: users.filter(u => u.role === 'admin').length,
      };

      setStats(prev => ({
        ...prev,
        totalUsers: users.length,
        totalHotels: sortedHotels.length,
        totalBookings: bookings.length,
        totalRevenue: bookings
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        bookingStats,
        revenueStats,
        userStats,
      }));

      setHotels(sortedHotels);
    };

    fetchInitialStats();
  }, [fetchWithRetry]);

  // Fetch bookings data when tab is active with caching
  useEffect(() => {
    const fetchBookings = async () => {
      if (activeTab === 0 && filteredBookings.length === 0) {
        try {
          setLoading(true);
          
          // Use cached data if available
          if (cacheRef.current.bookings && cacheRef.current.users) {
            const bookings = cacheRef.current.bookings;
            const users = cacheRef.current.users;

            // Fetch room data for each unique hotel in the bookings
            const uniqueHotelIds = [...new Set(bookings.map(b => b.hotel?._id).filter(Boolean))];
            await Promise.all(
              uniqueHotelIds.map(hotelId => getHotelRooms(hotelId))
            );

            const initialBookings = bookings
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 20)
              .map(booking => ({
                ...booking,
                user: users.find(user => user._id === booking.user) || booking.user,
                room: cacheRef.current.rooms.get(booking.hotel?._id)?.rooms.find(
                  room => room._id === booking.room?._id
                ) || booking.room
              }));

            setFilteredBookings(initialBookings);
            setStats(prev => ({
              ...prev,
              recentBookings: initialBookings
            }));
            setLoading(false);
            return;
          }

          // Fetch fresh data if cache is invalid
          const bookingsResponse = await fetchWithRetry(() => bookingApi.getAll());
          if (!bookingsResponse.data.success) {
            throw new Error('Failed to fetch bookings');
          }

          const bookings = bookingsResponse.data.data;
          const usersResponse = await fetchWithRetry(() => authApi.getUsers());
          const users = usersResponse.data.data;

          // Fetch room data for each unique hotel
          const uniqueHotelIds = [...new Set(bookings.map(b => b.hotel?._id).filter(Boolean))];
          await Promise.all(
            uniqueHotelIds.map(hotelId => getHotelRooms(hotelId))
          );

          // Update cache
          cacheRef.current.bookings = bookings;
          cacheRef.current.users = users;
          cacheRef.current.lastFetch = Date.now();

          const initialBookings = bookings
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20)
            .map(booking => ({
              ...booking,
              user: users.find(user => user._id === booking.user) || booking.user,
              room: cacheRef.current.rooms.get(booking.hotel?._id)?.rooms.find(
                room => room._id === booking.room?._id
              ) || booking.room
            }));

            setFilteredBookings(initialBookings);
            setStats(prev => ({
              ...prev,
              recentBookings: initialBookings
            }));
        } catch (error) {
          console.error('Error fetching bookings:', error);
          setError(error.response?.data?.message || 'Failed to fetch bookings');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBookings();
  }, [activeTab, filteredBookings.length, getHotelRooms, fetchWithRetry]);

  // Load more bookings with caching
  const loadMoreBookings = async () => {
    if (loading) return;

    try {
      setLoading(true);
      
      // Use cached data if available
      if (cacheRef.current.bookings && cacheRef.current.users) {
        const bookings = cacheRef.current.bookings;
        const users = cacheRef.current.users;

        const newBookings = bookings
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(filteredBookings.length, filteredBookings.length + 20)
          .map(booking => ({
            ...booking,
            user: users.find(user => user._id === booking.user) || booking.user,
            room: cacheRef.current.rooms.get(booking.hotel?._id)?.rooms.find(
              room => room._id === booking.room?._id
            ) || booking.room
          }));

        setFilteredBookings(prev => [...prev, ...newBookings]);
        setStats(prev => ({
          ...prev,
          recentBookings: [...prev.recentBookings, ...newBookings]
        }));
        setLoading(false);
        return;
      }

      // Fetch fresh data if cache is invalid
      const bookingsResponse = await fetchWithRetry(() => bookingApi.getAll());
      if (!bookingsResponse.data.success) {
        throw new Error('Failed to fetch more bookings');
      }

      const bookings = bookingsResponse.data.data;
      const usersResponse = await fetchWithRetry(() => authApi.getUsers());
      const users = usersResponse.data.data;

      // Fetch room data for each unique hotel
      const uniqueHotelIds = [...new Set(bookings.map(b => b.hotel?._id).filter(Boolean))];
      await Promise.all(
        uniqueHotelIds.map(hotelId => getHotelRooms(hotelId))
      );

      // Update cache
      cacheRef.current.bookings = bookings;
      cacheRef.current.users = users;
      cacheRef.current.lastFetch = Date.now();

      const newBookings = bookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(filteredBookings.length, filteredBookings.length + 20)
        .map(booking => ({
          ...booking,
          user: users.find(user => user._id === booking.user) || booking.user,
          room: cacheRef.current.rooms.get(booking.hotel?._id)?.rooms.find(
            room => room._id === booking.room?._id
          ) || booking.room
        }));

      setFilteredBookings(prev => [...prev, ...newBookings]);
      setStats(prev => ({
        ...prev,
        recentBookings: [...prev.recentBookings, ...newBookings]
      }));
    } catch (error) {
      console.error('Error loading more bookings:', error);
      setError(error.response?.data?.message || 'Failed to load more bookings');
    } finally {
      setLoading(false);
    }
  };

  // Memoize filtered bookings to prevent unnecessary recalculations
  const filteredBookingsMemo = useMemo(() => {
    if (!stats.recentBookings) return [];
    
    let filtered = [...stats.recentBookings];

    if (searchQuery.userName) {
      filtered = filtered.filter(booking => 
        booking.user?.name?.toLowerCase().includes(searchQuery.userName.toLowerCase()) ||
        booking.user?.firstName?.toLowerCase().includes(searchQuery.userName.toLowerCase()) ||
        booking.user?.lastName?.toLowerCase().includes(searchQuery.userName.toLowerCase())
      );
    }

    if (searchQuery.email) {
      filtered = filtered.filter(booking => 
        booking.user?.email?.toLowerCase().includes(searchQuery.email.toLowerCase())
      );
    }

    if (searchQuery.hotelId) {
      filtered = filtered.filter(booking => 
        booking.hotel?._id === searchQuery.hotelId
      );
    }

    if (searchQuery.createdAt) {
      const createdAt = new Date(searchQuery.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      const nextDay = new Date(createdAt);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= createdAt && bookingDate < nextDay;
      });
    }

    if (searchQuery.startDate) {
      const startDate = new Date(searchQuery.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) >= startDate
      );
    }

    if (searchQuery.endDate) {
      const endDate = new Date(searchQuery.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) <= endDate
      );
    }

    return filtered;
  }, [searchQuery, stats.recentBookings]);

  const handleSearchChange = (field, value) => {
    setSearchQuery(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearSearch = () => {
    setSearchQuery({
      userName: '',
      email: '',
      hotelId: '',
      startDate: null,
      endDate: null,
      createdAt: null,
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, width: '100vw', overflowX: 'hidden' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="h1" sx={{ mb: { xs: 2, md: 0 } }}>
            Reports & Statistics
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Users</Typography>
                </Box>
                <Typography variant="h4">{stats.totalUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HotelIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Hotels</Typography>
                </Box>
                <Typography variant="h4">{stats.totalHotels}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EventIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Bookings</Typography>
                </Box>
                <Typography variant="h4">{stats.totalBookings}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MoneyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Revenue</Typography>
                </Box>
                <Typography variant="h4">
                  ETB {stats.totalRevenue.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Sections */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Bookings" />
            <Tab label="Revenue" />
            <Tab label="Users" />
          </Tabs>
        </Box>

        {/* Bookings Section */}
        {activeTab === 0 && (
          <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">Confirmed</Typography>
                    <Typography variant="h4">{stats.bookingStats.confirmed}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="error">Cancelled</Typography>
                    <Typography variant="h4">{stats.bookingStats.cancelled}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="success.main">Completed</Typography>
                    <Typography variant="h4">{stats.bookingStats.completed}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>Recent Bookings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Total Bookings: {filteredBookingsMemo.length}
            </Typography>
            
            {/* Search Filters */}
            <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
              <TextField
                label="Search by User Name"
                value={searchQuery.userName}
                onChange={(e) => handleSearchChange('userName', e.target.value)}
                size="small"
                sx={{ minWidth: '200px' }}
                InputProps={{
                  endAdornment: searchQuery.userName && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => handleSearchChange('userName', '')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Search by Email"
                value={searchQuery.email}
                onChange={(e) => handleSearchChange('email', e.target.value)}
                size="small"
                sx={{ minWidth: '200px' }}
                InputProps={{
                  endAdornment: searchQuery.email && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => handleSearchChange('email', '')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Autocomplete
                value={hotels.find(hotel => hotel._id === searchQuery.hotelId) || null}
                onChange={(event, newValue) => {
                  handleSearchChange('hotelId', newValue ? newValue._id : '');
                }}
                options={hotels}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Hotel"
                    size="small"
                    sx={{ minWidth: '200px' }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.address ? 
                            `${option.address.street}, ${option.address.city}, ${option.address.state} ${option.address.zipCode}` 
                            : 'No address available'}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                clearOnBlur={false}
                blurOnSelect={true}
              />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Created At"
                  value={searchQuery.createdAt}
                  onChange={(date) => handleSearchChange('createdAt', date)}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: '200px' } } }}
                />
                <DatePicker
                  label="Start Date"
                  value={searchQuery.startDate}
                  onChange={(date) => handleSearchChange('startDate', date)}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: '200px' } } }}
                />
                <DatePicker
                  label="End Date"
                  value={searchQuery.endDate}
                  onChange={(date) => handleSearchChange('endDate', date)}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: '200px' } } }}
                />
              </LocalizationProvider>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearSearch}
                size="small"
              >
                Clear Filters
              </Button>
            </Stack>

            <TableContainer>
              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  p: 4,
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  minHeight: '200px'
                }}>
                  <CircularProgress size={24} />
                </Box>
              ) : filteredBookingsMemo.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  p: 4,
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  minHeight: '200px'
                }}>
                  <Typography variant="h6" color="text.secondary">
                    No bookings found matching your search criteria
                  </Typography>
                </Box>
              ) : (
                <Table size="small" sx={{ width: '100%', tableLayout: 'auto' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Booking ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Hotel</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Check In</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Check Out</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBookingsMemo
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell>{booking._id}</TableCell>
                          <TableCell>
                            {booking.user?.name || 
                             (booking.user?.firstName && booking.user?.lastName 
                              ? `${booking.user.firstName} ${booking.user.lastName}`
                              : 'N/A')}
                          </TableCell>
                          <TableCell>{booking.user?.email || 'N/A'}</TableCell>
                          <TableCell>{booking.hotel?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {booking.room ? (
                              booking.room.roomNumber || booking.room.roomType || 'N/A'
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={booking.status}
                              color={
                                booking.status === 'confirmed' ? 'success' :
                                booking.status === 'cancelled' ? 'error' :
                                'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {booking.room ? (
                              `ETB ${booking.room.price?.toLocaleString() || '0'}`
                            ) : (
                              `ETB ${booking.totalPrice?.toLocaleString() || '0'}`
                            )}
                          </TableCell>
                          <TableCell>{formatDate(booking.checkInDate)}</TableCell>
                          <TableCell>{formatDate(booking.checkOutDate)}</TableCell>
                          <TableCell>{formatDate(booking.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
              {!loading && filteredBookingsMemo.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredBookingsMemo.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )}
            </TableContainer>

            {/* Add a Load More button at the bottom of the bookings table */}
            {!loading && filteredBookingsMemo.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={loadMoreBookings}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Loading...' : 'Load More Bookings'}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Revenue Section */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Daily Revenue</Typography>
                  </Box>
                  <Typography variant="h4">
                    ETB {stats.revenueStats.daily.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Weekly Revenue</Typography>
                  </Box>
                  <Typography variant="h4">
                    ETB {stats.revenueStats.weekly.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Monthly Revenue</Typography>
                  </Box>
                  <Typography variant="h4">
                    ETB {stats.revenueStats.monthly.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Users Section */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">Regular Users</Typography>
                  <Typography variant="h4">{stats.userStats.regular}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="secondary">Hotel Managers</Typography>
                  <Typography variant="h4">{stats.userStats.hotelManagers}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info">Admins</Typography>
                  <Typography variant="h4">{stats.userStats.admins}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default Reports; 