import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  TextField,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Notifications,
  Payment,
  Security,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { authApi } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
}));

const Profile = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
  });

  useEffect(() => {
    if (authUser) {
      setProfileData({
        name: authUser.name || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        address: authUser.address || '',
        bio: authUser.bio || '',
      });
    }
  }, [authUser]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleSaveClick = async () => {
    try {
      setLoading(true);
      const response = await authApi.updateProfile(profileData);
      setAuthUser(response.data);
      setEditMode(false);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update profile',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      await authApi.updatePassword({ currentPassword, newPassword });
      setSnackbar({
        open: true,
        message: 'Password updated successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update password',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h5">Please log in to view your profile</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <StyledPaper elevation={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{ width: 100, height: 100, mr: 3 }}
              src={authUser.avatar}
            >
              {authUser.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                {profileData.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Member since {new Date(authUser.createdAt).getFullYear()}
              </Typography>
            </Box>
            {!editMode ? (
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                sx={{ ml: 'auto' }}
                onClick={handleEditClick}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                color="primary"
                sx={{ ml: 'auto' }}
                onClick={handleSaveClick}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            )}
          </Box>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Personal Info" />
            <Tab label="Security" />
            <Tab label="Notifications" />
            <Tab label="Payment Methods" />
          </Tabs>

          {activeTab === 0 && (
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    multiline
                    rows={4}
                    value={profileData.bio}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ mt: 4 }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Change Password"
                    secondary="Update your account password"
                  />
                  <Button 
                    variant="outlined"
                    onClick={() => {
                      const currentPassword = prompt('Enter current password:');
                      if (currentPassword) {
                        const newPassword = prompt('Enter new password:');
                        if (newPassword) {
                          handlePasswordChange(currentPassword, newPassword);
                        }
                      }
                    }}
                  >
                    Change
                  </Button>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Add an extra layer of security"
                  />
                  <Button variant="outlined">Enable</Button>
                </ListItem>
              </List>
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ mt: 4 }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive updates about your bookings"
                  />
                  <Button variant="outlined">Manage</Button>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="SMS Notifications"
                    secondary="Get text messages about your bookings"
                  />
                  <Button variant="outlined">Manage</Button>
                </ListItem>
              </List>
            </Box>
          )}

          {activeTab === 3 && (
            <Box sx={{ mt: 4 }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Payment />
                  </ListItemIcon>
                  <ListItemText
                    primary="Credit Card"
                    secondary="**** **** **** 1234"
                  />
                  <Button variant="outlined">Edit</Button>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Payment />
                  </ListItemIcon>
                  <ListItemText
                    primary="PayPal"
                    secondary={authUser.email}
                  />
                  <Button variant="outlined">Edit</Button>
                </ListItem>
              </List>
            </Box>
          )}
        </StyledPaper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile; 