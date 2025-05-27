const fs = require('fs');
const path = require('path');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const mongoose = require('mongoose');

// @desc    Get all rooms
// @route   GET /api/v1/rooms
// @access  Public
exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().populate('hotel', 'name address');

        // Ensure proper image URLs
        const roomsData = rooms.map(room => {
            const roomData = room.toObject();
            if (roomData.images) {
                roomData.images = roomData.images.map(image => {
                    // If it's already a full URL, return it
                    if (image.url.startsWith('http')) {
                        return image;
                    }
                    // Otherwise, construct the full URL
                    const baseUrl = process.env.API_URL || 'http://localhost:5000';
                    return {
                        ...image,
                        url: `${baseUrl}${image.url.startsWith('/') ? image.url : `/${image.url}`}`
                    };
                });
            }
            return roomData;
        });

        res.status(200).json({
            success: true,
            count: rooms.length,
            data: roomsData
        });
    } catch (err) {
        console.error('Error getting rooms:', err);
        res.status(500).json({
            success: false,
            message: 'Error getting rooms. Please try again later.'
        });
    }
};

// @desc    Get single room
// @route   GET /api/v1/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('hotel', 'name address');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Ensure proper image URLs
        const roomData = room.toObject();
        if (roomData.images) {
            roomData.images = roomData.images.map(image => {
                // If it's already a full URL, return it
                if (image.url.startsWith('http')) {
                    return image;
                }
                // Otherwise, construct the full URL
                const baseUrl = process.env.API_URL || 'http://localhost:5000';
                return {
                    ...image,
                    url: `${baseUrl}${image.url.startsWith('/') ? image.url : `/${image.url}`}`
                };
            });
        }

        res.status(200).json({
            success: true,
            data: roomData
        });
    } catch (err) {
        console.error('Error getting room:', err);
        res.status(500).json({
            success: false,
            message: 'Error getting room. Please try again later.'
        });
    }
};

// @desc    Create room
// @route   POST /api/v1/rooms
// @access  Private/HotelManager/Admin
exports.createRoom = async (req, res) => {
    try {
        const { roomNumber, type, description, price, capacity, amenities, isAvailable } = req.body;

        // Validate required fields
        if (!roomNumber || !type || !description || !price || !capacity) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Ensure capacity values are valid numbers
        const adults = parseInt(capacity.adults) || 1;
        const children = parseInt(capacity.children) || 0;

        // Validate capacity values
        if (adults < 1) {
            return res.status(400).json({
                success: false,
                message: 'Must have at least 1 adult capacity'
            });
        }

        if (children < 0) {
            return res.status(400).json({
                success: false,
                message: 'Children capacity cannot be negative'
            });
        }

        // Get the hotel ID from the authenticated user
        const hotelId = req.user.hotel?._id;
        if (!hotelId) {
            return res.status(400).json({
                success: false,
                message: 'No hotel assigned to user'
            });
        }

        // Create the room first
        const room = new Room({
            roomNumber,
            type,
            description,
            price,
            capacity: {
                adults,
                children
            },
            amenities: amenities || [],
            isAvailable: isAvailable !== undefined ? isAvailable : true,
            hotel: hotelId, // Add the hotel ID
            images: [] // Initialize with empty images array
        });

        // Save the room to get its ID
        await room.save();

        // If there are files to upload, process them
        if (req.files && req.files.length > 0) {
            const images = req.files.map(file => ({
                filename: file.filename,
                url: `/uploads/rooms/${file.filename}`
            }));

            // Update the room with the image information
            room.images = images;
            await room.save();
        }

        res.status(201).json({
            success: true,
            data: room
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update room
// @route   PUT /api/v1/rooms/:id
// @access  Private/HotelManager/Admin
exports.updateRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const hotel = await Hotel.findById(room.hotel);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Make sure user is hotel manager or admin
        if (hotel.manager.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update rooms in this hotel'
            });
        }

        // Create update object
        const updateData = { ...req.body };

        // If images are provided, ensure they have the correct format
        if (updateData.images) {
            updateData.images = updateData.images.map(img => {
                // If it's already an object with filename and url, keep it
                if (typeof img === 'object' && img.filename && img.url) {
                    return img;
                }
                // If it's a string URL, convert it to the new format
                if (typeof img === 'string' && !img.startsWith('blob:')) {
                    return {
                        filename: img.split('/').pop(),
                        url: img
                    };
                }
                // If it's a blob URL or invalid format, return null (will be filtered out)
                return null;
            }).filter(img => img !== null); // Remove null values
        }

        // Update the room
        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: updatedRoom
        });
    } catch (err) {
        console.error('Error updating room:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating room. Please try again later.'
        });
    }
};

// @desc    Delete room
// @route   DELETE /api/v1/rooms/:id
// @access  Private/HotelManager/Admin
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const hotel = await Hotel.findById(room.hotel);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Make sure user is hotel manager or admin
        if (hotel.manager.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete rooms from this hotel'
            });
        }

        // Delete room images from storage
        if (room.images && room.images.length > 0) {
            room.images.forEach(image => {
                try {
                    // Handle both old string format and new object format
                    const filename = typeof image === 'string' ? image : image.filename;
                    if (filename) {
                        const imagePath = path.join(__dirname, '../uploads/rooms', filename);
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                        }
                    }
                } catch (err) {
                    console.error('Error deleting image:', err);
                    // Continue with other images even if one fails
                }
            });
        }

        // Remove room from hotel's rooms array
        await Hotel.findByIdAndUpdate(
            room.hotel,
            { $pull: { rooms: room._id } }
        );

        // Delete the room document
        await Room.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting room:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting room. Please try again later.'
        });
    }
};

// @desc    Get rooms for a specific hotel
// @route   GET /api/v1/hotels/:hotelId/rooms
// @access  Public
exports.getHotelRooms = async (req, res, next) => {
    try {
        const rooms = await Room.find({ hotel: req.params.hotelId });

        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get available rooms for a specific hotel
// @route   GET /api/v1/hotels/:hotelId/rooms/available
// @access  Public
exports.getAvailableRooms = async (req, res, next) => {
    try {
        const rooms = await Room.find({
            hotel: req.params.hotelId,
            isAvailable: true
        });

        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Upload images for a room
// @route   POST /api/v1/rooms/:id/images
// @access  Private/HotelManager/Admin
exports.uploadImages = async (req, res) => {
    try {
        const roomId = req.params.id;
        
        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        // Validate roomId format
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID format'
            });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const images = req.files.map(file => ({
            filename: file.filename,
            url: `/uploads/rooms/${file.filename}` // Ensure correct path
        }));

        // Add new images to existing ones
        room.images = [...room.images, ...images];
        await room.save();

        res.status(200).json({
            success: true,
            data: room.images
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 