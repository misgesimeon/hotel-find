const express = require('express');
const router = express.Router();
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const auth = require('../middleware/auth');

// Get all rooms for a hotel
router.get('/hotel/:hotelId', async (req, res) => {
    try {
        const rooms = await Room.find({ hotel: req.params.hotelId });
        res.json({ 
            success: true,
            data: rooms 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Get single room
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json({ 
            success: true,
            data: room 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Create new room
router.post('/', auth, async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.body.hotel);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        const room = new Room(req.body);
        await room.save();

        // Add room to hotel's rooms array
        hotel.rooms.push(room._id);
        await hotel.save();

        res.status(201).json({ 
            success: true,
            data: room 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Update room
router.put('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json({ 
            success: true,
            data: room 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Delete room
router.delete('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Remove room from hotel's rooms array
        await Hotel.findByIdAndUpdate(
            room.hotel,
            { $pull: { rooms: room._id } }
        );

        res.json({ 
            success: true,
            message: 'Room deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Upload room images
router.post('/:id/images', auth, uploadMultiple('images', 5), async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const images = req.files.map(file => file.filename);
        room.images = [...room.images, ...images];
        await room.save();

        res.json({ 
            success: true,
            message: 'Images uploaded successfully', 
            images: room.images 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

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