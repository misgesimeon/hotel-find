const express = require('express');
const router = express.Router();
const {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    getHotelBookings,
    confirmBooking,
    cancelBooking
} = require('../controllers/bookings');
const { protect, authorize } = require('../middleware/auth');

// Get all bookings
router.get('/', protect, getBookings);

// Get single booking
router.get('/:id', protect, getBooking);

// Create booking
router.post('/', protect, createBooking);

// Update booking
router.put('/:id', protect, updateBooking);

// Delete booking
router.delete('/:id', protect, deleteBooking);

// Get bookings for a specific hotel
router.get('/hotel/:hotelId', protect, authorize('admin', 'hotel_manager'), getHotelBookings);

// Confirm booking
router.post('/:id/confirm', protect, authorize(['admin', 'hotel_manager']), confirmBooking);

// Cancel booking
router.post('/:id/cancel', protect, authorize(['admin', 'hotel_manager']), cancelBooking);

module.exports = router; 