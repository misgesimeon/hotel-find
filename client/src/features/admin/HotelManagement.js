import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { hotelApi } from '../../services/api';
import { authApi, bookingApi } from '../../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const HotelManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newHotel, setNewHotel] = useState({
    name: '',
    description: '',
    location: '',
    price: 0,
    managerEmail: '',
    amenities: [],
    isFeatured: false,
    isActive: true,
    address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Ethiopia'
    },
    contact: {
        phone: '',
        email: '',
        website: ''
    }
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelRooms, setHotelRooms] = useState([]);
  const [detailTab, setDetailTab] = useState(0);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    type: '',
    description: '',
    price: '',
    capacity: { adults: 1, children: 0 },
    amenities: [],
    isAvailable: true,
  });
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [revenueDateRange, setRevenueDateRange] = useState({ start: null, end: null });

  const commonAmenities = [
    { id: 'wifi', label: 'WiFi' },
    { id: 'parking', label: 'Parking' },
    { id: 'pool', label: 'Swimming Pool' },
    { id: 'gym', label: 'Fitness Center' },
    { id: 'spa', label: 'Spa' },
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'bar', label: 'Bar' },
    { id: 'concierge', label: 'Concierge' },
    { id: 'room_service', label: '24/7 Room Service' },
    { id: 'laundry', label: 'Laundry Service' },
    { id: 'business_center', label: 'Business Center' },
    { id: 'meeting_rooms', label: 'Meeting Rooms' }
  ];

  const handleAmenityChange = (amenityId) => {
    setNewHotel(prev => {
      const newAmenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities: newAmenities };
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter hotels based on search query
    const filtered = hotels.filter(hotel => 
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHotels(filtered);
  }, [searchQuery, hotels]);

  const fetchData = async () => {
    try {
      const [hotelsRes, usersRes] = await Promise.all([
        hotelApi.getAll(),
        authApi.getUsers(),
      ]);
      
      // Fetch rooms for each hotel
      const hotelsWithRooms = await Promise.all(
        hotelsRes.data.data.map(async (hotel) => {
          try {
            const roomsResponse = await hotelApi.getHotelRooms(hotel._id);
            return {
              ...hotel,
              rooms: roomsResponse.data.data || []
            };
          } catch (error) {
            console.error(`Error fetching rooms for hotel ${hotel._id}:`, error);
            return {
              ...hotel,
              rooms: []
            };
          }
        })
      );

      setHotels(hotelsWithRooms);
      setFilteredHotels(hotelsWithRooms);
      setUsers(usersRes.data.data.filter(user => user.role === 'hotel_manager') || []);
    } catch (error) {
      setError('Failed to fetch data');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotel = async () => {
    try {
        // Validate required fields
        if (!newHotel.name || !newHotel.description || !newHotel.location || !newHotel.price) {
            setError('Please fill in all required fields');
            setSnackbarOpen(true);
            return;
        }

        // Find manager by email
        const manager = users.find(user => user.email === newHotel.managerEmail);
        if (!manager) {
            setError('Selected manager not found');
            setSnackbarOpen(true);
            return;
        }

        // Prepare hotel data
        const hotelData = {
            name: newHotel.name,
            description: newHotel.description,
            location: {
                type: 'Point',
                coordinates: [0, 0],
                address: newHotel.location || ''
            },
            price: Number(newHotel.price),
            manager: manager._id,
            amenities: newHotel.amenities || [],
            isFeatured: newHotel.isFeatured,
            isActive: newHotel.isActive,
            address: {
                street: newHotel.address.street || '',
                city: newHotel.address.city || '',
                state: newHotel.address.state || '',
                zipCode: newHotel.address.zipCode || '',
                country: newHotel.address.country || 'Ethiopia'
            },
            contact: {
                phone: newHotel.contact.phone || '',
                email: newHotel.contact.email || '',
                website: newHotel.contact.website || ''
            },
            policies: {
                checkIn: '14:00',
                checkOut: '12:00',
                cancellation: 'Free cancellation up to 24 hours before check-in'
            }
        };

        console.log('Sending hotel data:', JSON.stringify(hotelData, null, 2));
        try {
            const response = await hotelApi.create(hotelData);
            console.log('Hotel creation response:', response.data);
            
            if (response.data && response.data.success) {
                setSuccess('Hotel created successfully');
                setSnackbarOpen(true);
                setOpenDialog(false);
                fetchData();
                setNewHotel({
                    name: '',
                    description: '',
                    location: '',
                    price: 0,
                    managerEmail: '',
                    amenities: [],
                    isFeatured: false,
                    isActive: true,
                    address: {
                        street: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        country: 'Ethiopia'
                    },
                    contact: {
                        phone: '',
                        email: '',
                        website: ''
                    }
                });
            } else {
                throw new Error(response.data?.message || 'Failed to create hotel');
            }
        } catch (error) {
            console.error('Hotel creation error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.errors?.join(', ') || 
                               error.message || 
                               'Failed to create hotel';
            setError(errorMessage);
            setSnackbarOpen(true);
        }
    } catch (error) {
        console.error('Hotel creation error:', error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.errors?.join(', ') || 
                           error.message || 
                           'Failed to create hotel';
        setError(errorMessage);
        setSnackbarOpen(true);
    }
};

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setError('');
    setSuccess('');
  };

  const handleEditHotel = (hotel) => {
    setEditingHotel({
      ...hotel,
      managerEmail: hotel.manager?.email || '',
      amenities: hotel.amenities || [],
      isFeatured: hotel.isFeatured || false,
      isActive: hotel.isActive !== undefined ? hotel.isActive : true
    });
    setEditDialogOpen(true);
  };

  const handleEditAmenityChange = (amenityId) => {
    setEditingHotel(prev => {
      const newAmenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleUpdateHotel = async () => {
    try {
      if (!editingHotel.name || !editingHotel.description || !editingHotel.location || !editingHotel.price) {
        setError('Please fill in all required fields');
        setSnackbarOpen(true);
        return;
      }

      const manager = users.find(user => user.email === editingHotel.managerEmail);
      if (!manager) {
        setError('Selected manager not found');
        setSnackbarOpen(true);
        return;
      }

      // Create update object with only the fields that are provided
      const updateFields = {
        name: editingHotel.name,
        description: editingHotel.description,
        location: {
          type: 'Point',
          coordinates: [0, 0],
          address: typeof editingHotel.location === 'string' ? editingHotel.location : editingHotel.location?.address
        },
        price: Number(editingHotel.price),
        manager: manager._id,
        amenities: editingHotel.amenities || [],
        isFeatured: Boolean(editingHotel.isFeatured),
        isActive: Boolean(editingHotel.isActive)
      };

      // Add optional fields if they exist
      if (editingHotel.address) {
        updateFields.address = editingHotel.address;
      }
      if (editingHotel.contact) {
        updateFields.contact = editingHotel.contact;
      }
      if (editingHotel.policies) {
        updateFields.policies = editingHotel.policies;
      }

      console.log('Updating hotel with data:', JSON.stringify(updateFields, null, 2));
      console.log('Hotel ID:', editingHotel._id);

      const response = await hotelApi.update(editingHotel._id, updateFields);
      console.log('Update response:', response);
      
      if (response.data && response.data.success) {
        // Update the local state immediately with the updated hotel data
        const updatedHotel = response.data.data;
        
        // Update both hotels and filteredHotels arrays
        setHotels(prevHotels => 
          prevHotels.map(hotel => 
            hotel._id === editingHotel._id 
              ? { ...hotel, ...updatedHotel }
              : hotel
          )
        );
        
        setFilteredHotels(prevHotels => 
          prevHotels.map(hotel => 
            hotel._id === editingHotel._id 
              ? { ...hotel, ...updatedHotel }
              : hotel
          )
        );

        setSuccess('Hotel updated successfully');
        setSnackbarOpen(true);
        setEditDialogOpen(false);
        
        // Fetch fresh data in the background
        fetchData();
      } else {
        throw new Error(response.data?.message || 'Failed to update hotel');
      }
    } catch (error) {
      console.error('Hotel update error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.errors?.join(', ') || 
                         error.message || 
                         'Failed to update hotel';
      setError(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!hotelId) {
      setError('Invalid hotel ID');
      setSnackbarOpen(true);
      return;
    }

    if (window.confirm('Are you sure you want to delete this hotel?')) {
      try {
        console.log('Starting delete process for hotel ID:', hotelId);
        
        // First verify the hotel exists
        try {
          const hotelResponse = await hotelApi.getById(hotelId);
          console.log('Hotel exists check response:', hotelResponse);
          
          if (!hotelResponse.data || !hotelResponse.data.success) {
            throw new Error('Hotel not found');
          }
        } catch (error) {
          console.error('Error checking if hotel exists:', error);
          throw new Error('Could not verify hotel existence');
        }

        // Attempt to delete
        console.log('Attempting to delete hotel...');
        const deleteResponse = await hotelApi.delete(hotelId);
        console.log('Delete API response:', deleteResponse);
        
        if (!deleteResponse) {
          throw new Error('No response received from server');
        }

        if (deleteResponse.data && deleteResponse.data.success) {
          console.log('Delete successful');
          setSuccess('Hotel deleted successfully');
          setSnackbarOpen(true);
          // Update the hotels list by filtering out the deleted hotel
          setHotels(prevHotels => prevHotels.filter(hotel => hotel._id !== hotelId));
        } else {
          console.error('Delete response indicates failure:', deleteResponse.data);
          throw new Error(deleteResponse.data?.message || 'Failed to delete hotel');
        }
      } catch (error) {
        console.error('Detailed delete error:', {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack
        });
        
        let errorMessage = 'Failed to delete hotel';
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = 'Hotel not found';
          } else if (error.response.status === 401) {
            errorMessage = 'You are not authorized to delete this hotel';
          } else if (error.response.status === 403) {
            errorMessage = 'You do not have permission to delete this hotel';
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data?.errors) {
            errorMessage = error.response.data.errors.join(', ');
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        setSnackbarOpen(true);
      }
    }
  };

  const handleViewDetails = async (hotel) => {
    try {
      setSelectedHotel(hotel);
      const roomsResponse = await hotelApi.getHotelRooms(hotel._id);
      setHotelRooms(roomsResponse.data.data || []);
      // Fetch bookings for the hotel
      const bookingsResponse = await bookingApi.getHotelBookings(hotel._id);
      setHotelBookings(bookingsResponse.data.data || []);
      setDetailDialogOpen(true);
    } catch (error) {
      setError('Failed to fetch hotel details');
      setSnackbarOpen(true);
    }
  };

  const handleRoomSubmit = async () => {
    try {
      if (editingRoom) {
        // Update existing room
        const response = await hotelApi.updateRoom(selectedHotel._id, editingRoom._id, editingRoom);
        setHotelRooms(hotelRooms.map(room => 
          room._id === editingRoom._id ? response.data.data : room
        ));
        setSuccess('Room updated successfully');
      } else {
        // Add new room
        const response = await hotelApi.addRoom(selectedHotel._id, newRoom);
        setHotelRooms([...hotelRooms, response.data.data]);
        setSuccess('Room added successfully');
      }
      setShowAddRoomDialog(false);
      setEditingRoom(null);
      setNewRoom({
        roomNumber: '',
        type: '',
        description: '',
        price: '',
        capacity: { adults: 1, children: 0 },
        amenities: [],
        isAvailable: true,
      });
      setSnackbarOpen(true);
    } catch (error) {
      setError('Failed to save room');
      setSnackbarOpen(true);
    }
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
            Hotel Management
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
            Add New Hotel
          </Button>
        </Box>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search hotels by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        <TableContainer>
          <Table size="small" sx={{ width: '100%', tableLayout: 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell>Hotel Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Current Manager</TableCell>
                <TableCell>Total Rooms</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHotels.map((hotel) => (
                <TableRow key={hotel._id}>
                  <TableCell>{hotel.name}</TableCell>
                  <TableCell>{hotel.location?.address || 'No location specified'}</TableCell>
                  <TableCell>{hotel.manager?.email || 'No manager assigned'}</TableCell>
                  <TableCell>
                    <Typography>{hotel.rooms?.length || 0}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewDetails(hotel)} color="info" title="View Details">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleEditHotel(hotel)} color="primary" title="Edit Hotel">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteHotel(hotel._id)} color="error" title="Delete Hotel">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Hotel</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Hotel Name"
              value={newHotel.name}
              onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newHotel.description}
              onChange={(e) => setNewHotel({ ...newHotel, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <TextField
              fullWidth
              label="Location"
              value={newHotel.location}
              onChange={(e) => setNewHotel({ ...newHotel, location: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Price"
              value={newHotel.price}
              onChange={(e) => setNewHotel({ ...newHotel, price: Number(e.target.value) })}
              margin="normal"
              type="number"
              required
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Status
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newHotel.isFeatured}
                      onChange={(e) => setNewHotel({ ...newHotel, isFeatured: e.target.checked })}
                    />
                  }
                  label="Featured Hotel"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newHotel.isActive}
                      onChange={(e) => setNewHotel({ ...newHotel, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </FormGroup>
            </Box>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Amenities
              </Typography>
              <FormGroup row>
                {commonAmenities.map((amenity) => (
                  <FormControlLabel
                    key={amenity.id}
                    control={
                      <Checkbox
                        checked={newHotel.amenities.includes(amenity.id)}
                        onChange={() => handleAmenityChange(amenity.id)}
                      />
                    }
                    label={amenity.label}
                  />
                ))}
              </FormGroup>
            </Box>
            <TextField
              fullWidth
              label="Street Address"
              value={newHotel.address.street}
              onChange={(e) => setNewHotel({ 
                ...newHotel, 
                address: { ...newHotel.address, street: e.target.value } 
              })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="City"
              value={newHotel.address.city}
              onChange={(e) => setNewHotel({ 
                ...newHotel, 
                address: { ...newHotel.address, city: e.target.value } 
              })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="State"
              value={newHotel.address.state}
              onChange={(e) => setNewHotel({ 
                ...newHotel, 
                address: { ...newHotel.address, state: e.target.value } 
              })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Zip Code"
              value={newHotel.address.zipCode}
              onChange={(e) => setNewHotel({ 
                ...newHotel, 
                address: { ...newHotel.address, zipCode: e.target.value } 
              })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              value={newHotel.contact.phone}
              onChange={(e) => setNewHotel({ 
                ...newHotel, 
                contact: { ...newHotel.contact, phone: e.target.value } 
              })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              value={newHotel.contact.email}
              onChange={(e) => setNewHotel({ 
                ...newHotel, 
                contact: { ...newHotel.contact, email: e.target.value } 
              })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Website"
              value={newHotel.contact.website}
              onChange={(e) => setNewHotel({ 
                ...newHotel, 
                contact: { ...newHotel.contact, website: e.target.value } 
              })}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Manager</InputLabel>
              <Select
                value={newHotel.managerEmail}
                onChange={(e) => setNewHotel({ ...newHotel, managerEmail: e.target.value })}
                required
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user.email}>
                    {user.name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateHotel} variant="contained" color="primary">
              Create
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Hotel</DialogTitle>
          <DialogContent>
            {editingHotel && (
              <>
                <TextField
                  fullWidth
                  label="Hotel Name"
                  value={editingHotel.name}
                  onChange={(e) => setEditingHotel({ ...editingHotel, name: e.target.value })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={editingHotel.description}
                  onChange={(e) => setEditingHotel({ ...editingHotel, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={4}
                  required
                />
                <TextField
                  fullWidth
                  label="Location"
                  value={editingHotel.location?.address || ''}
                  onChange={(e) => setEditingHotel({ 
                    ...editingHotel, 
                    location: { ...editingHotel.location, address: e.target.value } 
                  })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Price"
                  value={editingHotel.price}
                  onChange={(e) => setEditingHotel({ ...editingHotel, price: Number(e.target.value) })}
                  margin="normal"
                  type="number"
                  required
                />
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Status
                  </Typography>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editingHotel.isFeatured}
                          onChange={(e) => setEditingHotel({ ...editingHotel, isFeatured: e.target.checked })}
                        />
                      }
                      label="Featured Hotel"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editingHotel.isActive}
                          onChange={(e) => setEditingHotel({ ...editingHotel, isActive: e.target.checked })}
                        />
                      }
                      label="Active"
                    />
                  </FormGroup>
                </Box>
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Amenities
                  </Typography>
                  <FormGroup row>
                    {commonAmenities.map((amenity) => (
                      <FormControlLabel
                        key={amenity.id}
                        control={
                          <Checkbox
                            checked={editingHotel.amenities.includes(amenity.id)}
                            onChange={() => handleEditAmenityChange(amenity.id)}
                          />
                        }
                        label={amenity.label}
                      />
                    ))}
                  </FormGroup>
                </Box>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Manager</InputLabel>
                  <Select
                    value={editingHotel.managerEmail}
                    onChange={(e) => setEditingHotel({ ...editingHotel, managerEmail: e.target.value })}
                    required
                  >
                    {users.map((user) => (
                      <MenuItem key={user._id} value={user.email}>
                        {user.name} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateHotel} variant="contained" color="primary">
              Update
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedHotel?.name}</Typography>
              <IconButton onClick={() => setDetailDialogOpen(false)} aria-label="close">
                <span style={{ fontSize: 24, fontWeight: 'bold' }}>&times;</span>
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Tabs value={detailTab} onChange={(e, newValue) => setDetailTab(newValue)}>
              <Tab label="Overview" />
              <Tab label="Rooms" />
              <Tab label="Bookings" />
            </Tabs>

            {detailTab === 0 && selectedHotel && (
              <Box sx={{ mt: 2 }}>
                {selectedHotel.images && selectedHotel.images.length > 0 ? (
                  <img
                    src={typeof selectedHotel.images[0] === 'string' ? selectedHotel.images[0] : selectedHotel.images[0].url || selectedHotel.images[0].filename}
                    alt={selectedHotel.name}
                    style={{ width: '100%', maxHeight: 250, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
                  />
                ) : (
                  <Box sx={{ width: '100%', height: 200, bgcolor: 'grey.200', borderRadius: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No Image Available</Typography>
                  </Box>
                )}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Hotel Information</Typography>
                        <Typography><strong>Name:</strong> {selectedHotel.name}</Typography>
                        <Typography><strong>Description:</strong> {selectedHotel.description}</Typography>
                        <Typography><strong>Location:</strong> {selectedHotel.location?.address}</Typography>
                        <Typography><strong>Manager:</strong> {selectedHotel.manager?.email || 'No manager assigned'}</Typography>
                        <Typography><strong>Status:</strong> {selectedHotel.isActive ? 'Active' : 'Inactive'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Contact Information</Typography>
                        <Typography><strong>Phone:</strong> {selectedHotel.contact?.phone || 'N/A'}</Typography>
                        <Typography><strong>Email:</strong> {selectedHotel.contact?.email || 'N/A'}</Typography>
                        <Typography><strong>Website:</strong> {selectedHotel.contact?.website || 'N/A'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Amenities</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedHotel.amenities?.map((amenity) => (
                            <Chip key={amenity} label={amenity} />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {detailTab === 1 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Room Management</Typography>
                <TableContainer sx={{ overflowX: 'auto', mt: 2 }}>
                  <Table size="small" sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '15%' }}>Room Number</TableCell>
                        <TableCell sx={{ width: '15%' }}>Type</TableCell>
                        <TableCell sx={{ width: '15%' }}>Price</TableCell>
                        <TableCell sx={{ width: '20%' }}>Capacity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hotelRooms.map((room) => (
                        <TableRow key={room._id}>
                          <TableCell>{room.roomNumber}</TableCell>
                          <TableCell>{room.type}</TableCell>
                          <TableCell>ETB {room.price}</TableCell>
                          <TableCell>
                            {room.capacity.adults} Adults
                            {room.capacity.children > 0 && `, ${room.capacity.children} Children`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {detailTab === 2 && selectedHotel && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Revenue</Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <DatePicker
                      label="Start Date"
                      value={revenueDateRange.start}
                      onChange={(date) => setRevenueDateRange(r => ({ ...r, start: date }))}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: '150px' } } }}
                    />
                    <DatePicker
                      label="End Date"
                      value={revenueDateRange.end}
                      onChange={(date) => setRevenueDateRange(r => ({ ...r, end: date }))}
                      slotProps={{ textField: { size: 'small', sx: { minWidth: '150px' } } }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => setRevenueDateRange({ start: null, end: null })}
                      disabled={!revenueDateRange.start && !revenueDateRange.end}
                      sx={{ height: 40 }}
                    >
                      Clear Filters
                    </Button>
                  </Box>
                </LocalizationProvider>
                <Typography variant="h4" color="primary">
                  ETB {
                    hotelBookings
                      .filter(b => {
                        if (!revenueDateRange.start && !revenueDateRange.end) return true;
                        const created = new Date(b.createdAt);
                        if (revenueDateRange.start && created < new Date(revenueDateRange.start).setHours(0,0,0,0)) return false;
                        if (revenueDateRange.end && created > new Date(revenueDateRange.end).setHours(23,59,59,999)) return false;
                        return true;
                      })
                      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
                      .toLocaleString()
                  }
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={showAddRoomDialog}
          onClose={() => {
            setShowAddRoomDialog(false);
            setEditingRoom(null);
            setNewRoom({
              roomNumber: '',
              type: '',
              description: '',
              price: '',
              capacity: { adults: 1, children: 0 },
              amenities: [],
              isAvailable: true,
            });
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingRoom ? 'Edit Room' : 'Add New Room'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Room Number"
                  value={editingRoom?.roomNumber || newRoom.roomNumber}
                  onChange={(e) => {
                    if (editingRoom) {
                      setEditingRoom({ ...editingRoom, roomNumber: e.target.value });
                    } else {
                      setNewRoom({ ...newRoom, roomNumber: e.target.value });
                    }
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={editingRoom?.type || newRoom.type}
                    onChange={(e) => {
                      if (editingRoom) {
                        setEditingRoom({ ...editingRoom, type: e.target.value });
                      } else {
                        setNewRoom({ ...newRoom, type: e.target.value });
                      }
                    }}
                    label="Room Type"
                  >
                    <MenuItem value="Single">Single</MenuItem>
                    <MenuItem value="Double">Double</MenuItem>
                    <MenuItem value="Suite">Suite</MenuItem>
                    <MenuItem value="Deluxe">Deluxe</MenuItem>
                    <MenuItem value="Family">Family</MenuItem>
                    <MenuItem value="Executive">Executive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={editingRoom?.description || newRoom.description}
                  onChange={(e) => {
                    if (editingRoom) {
                      setEditingRoom({ ...editingRoom, description: e.target.value });
                    } else {
                      setNewRoom({ ...newRoom, description: e.target.value });
                    }
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={editingRoom?.price || newRoom.price}
                  onChange={(e) => {
                    if (editingRoom) {
                      setEditingRoom({ ...editingRoom, price: e.target.value });
                    } else {
                      setNewRoom({ ...newRoom, price: e.target.value });
                    }
                  }}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editingRoom?.isAvailable ?? newRoom.isAvailable}
                    onChange={(e) => {
                      if (editingRoom) {
                        setEditingRoom({ ...editingRoom, isAvailable: e.target.value });
                      } else {
                        setNewRoom({ ...newRoom, isAvailable: e.target.value });
                      }
                    }}
                    label="Status"
                  >
                    <MenuItem value={true}>Available</MenuItem>
                    <MenuItem value={false}>Occupied</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Adult Capacity"
                  type="number"
                  value={editingRoom?.capacity?.adults || newRoom.capacity.adults}
                  onChange={(e) => {
                    if (editingRoom) {
                      setEditingRoom({
                        ...editingRoom,
                        capacity: { ...editingRoom.capacity, adults: parseInt(e.target.value) }
                      });
                    } else {
                      setNewRoom({
                        ...newRoom,
                        capacity: { ...newRoom.capacity, adults: parseInt(e.target.value) }
                      });
                    }
                  }}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Children Capacity"
                  type="number"
                  value={editingRoom?.capacity?.children || newRoom.capacity.children}
                  onChange={(e) => {
                    if (editingRoom) {
                      setEditingRoom({
                        ...editingRoom,
                        capacity: { ...editingRoom.capacity, children: parseInt(e.target.value) }
                      });
                    } else {
                      setNewRoom({
                        ...newRoom,
                        capacity: { ...newRoom.capacity, children: parseInt(e.target.value) }
                      });
                    }
                  }}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Room Amenities
                </Typography>
                <FormGroup row>
                  {commonAmenities.map((amenity) => (
                    <FormControlLabel
                      key={amenity.id}
                      control={
                        <Checkbox
                          checked={
                            editingRoom
                              ? editingRoom.amenities?.includes(amenity.id)
                              : newRoom.amenities?.includes(amenity.id)
                          }
                          onChange={(e) => {
                            if (editingRoom) {
                              const newAmenities = e.target.checked
                                ? [...(editingRoom.amenities || []), amenity.id]
                                : (editingRoom.amenities || []).filter(a => a !== amenity.id);
                              setEditingRoom({ ...editingRoom, amenities: newAmenities });
                            } else {
                              const newAmenities = e.target.checked
                                ? [...(newRoom.amenities || []), amenity.id]
                                : (newRoom.amenities || []).filter(a => a !== amenity.id);
                              setNewRoom({ ...newRoom, amenities: newAmenities });
                            }
                          }}
                        />
                      }
                      label={amenity.label}
                    />
                  ))}
                </FormGroup>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowAddRoomDialog(false);
                setEditingRoom(null);
                setNewRoom({
                  roomNumber: '',
                  type: '',
                  description: '',
                  price: '',
                  capacity: { adults: 1, children: 0 },
                  amenities: [],
                  isAvailable: true,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoomSubmit}
              variant="contained"
              color="primary"
            >
              {editingRoom ? 'Update Room' : 'Add Room'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={error ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default HotelManagement; 