import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import UserManagement from './UserManagement';
import HotelManagement from './HotelManagement';
import Reports from './Reports';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const AdminDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('users');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <List>
        <ListItem 
          button 
          onClick={() => navigate('/')}
        >
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem 
          button 
          selected={selectedTab === 'users'}
          onClick={() => handleTabChange('users')}
        >
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="User Management" />
        </ListItem>
        <ListItem 
          button 
          selected={selectedTab === 'hotels'}
          onClick={() => handleTabChange('hotels')}
        >
          <ListItemIcon>
            <HotelIcon />
          </ListItemIcon>
          <ListItemText primary="Hotel Management" />
        </ListItem>
        <ListItem 
          button 
          selected={selectedTab === 'reports'}
          onClick={() => handleTabChange('reports')}
        >
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText primary="Reports" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {selectedTab === 'users' ? 'User Management' : 
             selectedTab === 'hotels' ? 'Hotel Management' : 
             selectedTab === 'reports' ? 'Reports & Statistics' : ''}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        <Container maxWidth="lg">
          {selectedTab === 'users' ? (
            <UserManagement />
          ) : selectedTab === 'hotels' ? (
            <HotelManagement />
          ) : selectedTab === 'reports' ? (
            <Reports />
          ) : null}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard; 