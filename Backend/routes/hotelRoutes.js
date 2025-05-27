const express = require('express');
const router = express.Router();
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const Hotel = require('../models/Hotel');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Upload single hotel image
router.post('/:id/image', auth, uploadSingle('image'), async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }
        
        hotel.image = req.file.filename;
        await hotel.save();
        
        res.json({ 
            success: true,
            message: 'Image uploaded successfully', 
            image: hotel.image 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Upload multiple hotel images
router.post('/:id/images', auth, uploadMultiple('images', 5), async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }
        
        const images = req.files.map(file => file.filename);
        hotel.images = [...hotel.images, ...images];
        await hotel.save();
        
        res.json({ 
            success: true,
            message: 'Images uploaded successfully', 
            images: hotel.images 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Get all hotels
router.get('/', async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.json({ 
            success: true,
            data: hotels 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Get single hotel
router.get('/:id', async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }
        res.json({ 
            success: true,
            data: hotel 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Create new hotel
router.post('/', auth, async (req, res) => {
    try {
        const hotel = new Hotel(req.body);
        await hotel.save();
        res.status(201).json({ 
            success: true,
            data: hotel 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Update hotel
router.put('/:id', auth, authorize('admin', 'hotel_manager'), async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }
        res.json({ 
            success: true,
            data: hotel 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Delete hotel
router.delete('/:id', auth, async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }
        res.json({ 
            success: true,
            message: 'Hotel deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

module.exports = router; 