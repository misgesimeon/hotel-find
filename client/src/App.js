import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import Layout from './components/Layout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ResetPassword from './features/auth/ResetPassword';
import HotelSearch from './features/hotel/HotelSearch';
import SearchResults from './features/hotel/SearchResults';
import HotelDetails from './features/hotel/HotelDetails';
import BookingHistory from './features/booking/BookingHistory';
import BookingDetails from './features/booking/BookingDetails';
import HomePage from './pages/HomePage';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import AdminDashboard from './features/admin/AdminDashboard';
import HotelManagerDashboard from './features/hotel-manager/HotelManagerDashboard';
import { SearchProvider } from './contexts/SearchContext';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SearchProvider>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/search" element={<HotelSearch />} />
                  <Route path="/search/results" element={<SearchResults />} />
                  <Route path="/hotels/:id" element={<HotelDetails />} />
                  <Route path="/bookings" element={<BookingHistory />} />
                  <Route path="/bookings/:id" element={<BookingDetails />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/hotel-manager" element={<HotelManagerDashboard />} />
                </Routes>
              </Layout>
            </Router>
          </SnackbarProvider>
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 