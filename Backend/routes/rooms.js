const express = require('express');
const Room = require('../models/Room');
const {
    getRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    getHotelRooms,
    getAvailableRooms,
    uploadImages
} = require('../controllers/rooms');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Helper function to get file URL
const getFileUrl = (req, filename) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/uploads/${filename}`;
};

// Get all rooms
router.get('/', getRooms);

// Get single room
router.get('/:id', getRoom);

// Create room with images
router.post('/', 
  protect, 
  authorize('hotel_manager', 'admin'), 
  upload.array('images', 5), // Allow up to 5 images
  createRoom
);

// Update room
router.put('/:id', protect, authorize('hotel_manager', 'admin'), updateRoom);

// Delete room
router.delete('/:id', protect, authorize('hotel_manager', 'admin'), deleteRoom);

// Upload additional images for a room
router.post('/:id/images', 
  protect, 
  authorize('hotel_manager', 'admin'), 
  upload.array('images', 5), // Allow up to 5 images
  uploadImages
);

router.route('/hotel/:hotelId')
    .get(getHotelRooms);

router.route('/hotel/:hotelId/available')
    .get(getAvailableRooms);

// Check room availability
router.post('/:id/availability', async (req, res) => {
    try {
        const { checkIn, checkOut } = req.body;
        const room = await Room.findById(req.params.id);
        
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const isAvailable = room.isAvailableForDates(new Date(checkIn), new Date(checkOut));
        const totalPrice = room.calculateTotalPrice(new Date(checkIn), new Date(checkOut));

        res.json({ 
            success: true,
            data: {
                isAvailable,
                totalPrice,
                nights: Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

module.exports = router; 