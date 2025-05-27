const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
    try {
        console.log('Getting bookings for user:', {
            userId: req.user.id,
            role: req.user.role
        });

        let query;
        if (req.user.role === 'admin') {
            query = Booking.find();
        } else if (req.user.role === 'hotel_manager') {
            const hotels = await Hotel.find({ manager: req.user.id });
            const hotelIds = hotels.map(hotel => hotel._id);
            query = Booking.find({ hotel: { $in: hotelIds } });
        } else {
            query = Booking.find({ user: req.user.id });
        }

        console.log('Query:', query.getQuery());

        const bookings = await query.populate({
            path: 'hotel',
            select: 'name address'
        }).populate({
            path: 'room',
            select: 'roomType price'
        });

        console.log('Found bookings:', bookings.length);

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        console.error('Error in getBookings:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        next(err);
    }
};

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'hotel',
                select: 'name address'
            })
            .populate({
                path: 'room',
                select: 'roomType price'
            });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Make sure user is booking owner, hotel manager, or admin
        if (booking.user.toString() !== req.user.id && 
            req.user.role !== 'admin' && 
            req.user.role !== 'hotel_manager') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this booking'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create booking
// @route   POST /api/v1/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.user = req.user.id;

        // If createdBy is present and status is not set, set status to 'confirmed by Hotel'
        if (req.body.createdBy && !req.body.status) {
            req.body.status = 'confirmed by Hotel';
        }

        // Check if room exists
        const room = await Room.findById(req.body.room);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Calculate total price
        const checkInDate = new Date(req.body.checkInDate);
        const checkOutDate = new Date(req.body.checkOutDate);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        req.body.totalPrice = room.price * nights;
        req.body.roomPrice = room.price; // Save the real room price per night

        // Create the booking
        const booking = await Booking.create(req.body);

        // Add the booking to the room
        await room.addBooking({
            user: req.user.id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: req.body.guests,
            totalPrice: req.body.totalPrice,
            status: req.body.status || 'confirmed'
        });

        // Populate the booking with room information
        const populatedBooking = await Booking.findById(booking._id)
            .populate({
                path: 'room',
                select: 'roomNumber type price'
            });

        res.status(201).json({
            success: true,
            data: populatedBooking
        });
    } catch (err) {
        console.error('Booking creation error:', err);
        next(err);
    }
};

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Make sure user is booking owner, hotel manager, or admin
        if (booking.user.toString() !== req.user.id && 
            req.user.role !== 'admin' && 
            req.user.role !== 'hotel_manager') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Make sure user is booking owner, hotel manager, or admin
        if (booking.user.toString() !== req.user.id && 
            req.user.role !== 'admin' && 
            req.user.role !== 'hotel_manager') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this booking'
            });
        }

        // Update room availability
        const room = await Room.findById(booking.room);
        if (room) {
            room.isAvailable = true;
            await room.save();
        }

        await booking.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get bookings for a specific hotel
// @route   GET /api/v1/hotels/:hotelId/bookings
// @access  Private
exports.getHotelBookings = async (req, res, next) => {
    try {
        // Validate hotelId parameter
        if (!req.params.hotelId) {
            return res.status(400).json({
                success: false,
                message: 'Hotel ID is required'
            });
        }

        // Check if hotel exists
        const hotel = await Hotel.findById(req.params.hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Check if user is authorized (hotel manager or admin)
        if (hotel.manager.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view bookings for this hotel'
            });
        }

        // Build query object
        const queryObj = { hotel: req.params.hotelId };

        // Add date filters if provided
        if (req.query.checkIn) {
            const checkIn = new Date(req.query.checkIn);
            checkIn.setHours(0, 0, 0, 0);
            queryObj.checkInDate = { $gte: checkIn };
        }

        if (req.query.checkOut) {
            const checkOut = new Date(req.query.checkOut);
            checkOut.setHours(23, 59, 59, 999);
            queryObj.checkOutDate = { $lte: checkOut };
        }

        if (req.query.createdAt) {
            const createdAt = new Date(req.query.createdAt);
            createdAt.setHours(0, 0, 0, 0);
            const nextDay = new Date(createdAt);
            nextDay.setDate(nextDay.getDate() + 1);
            queryObj.createdAt = { $gte: createdAt, $lt: nextDay };
        }

        console.log('Query object:', JSON.stringify(queryObj, null, 2));

        const bookings = await Booking.find(queryObj)
            .populate({
                path: 'user',
                select: 'name email phone idNumber'
            })
            .populate({
                path: 'room',
                select: 'roomNumber roomType price capacity'
            })
            .sort({ createdAt: -1 }); // Sort by most recent first

        console.log('Found bookings:', bookings.length);

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        console.error('Error in getHotelBookings:', err);
        next(err);
    }
};

// @desc    Confirm booking
// @route   POST /api/v1/bookings/:id/confirm
// @access  Private (Admin, Hotel Manager)
exports.confirmBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user is authorized (admin or hotel manager of the hotel)
        if (req.user.role !== 'admin') {
            const hotel = await Hotel.findById(booking.hotel);
            if (!hotel || hotel.manager.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to confirm this booking'
                });
            }
        }

        // Update booking status
        booking.status = 'confirmed';
        await booking.save();

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Cancel booking
// @route   POST /api/v1/bookings/:id/cancel
// @access  Private (Admin, Hotel Manager)
exports.cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user is authorized (admin or hotel manager of the hotel)
        if (req.user.role !== 'admin') {
            const hotel = await Hotel.findById(booking.hotel);
            if (!hotel || hotel.manager.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to cancel this booking'
                });
            }
        }

        // Update booking status
        booking.status = 'cancelled';
        
        // Make room available again
        const room = await Room.findById(booking.room);
        if (room) {
            room.isAvailable = true;
            await room.save();
        }

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
}; 