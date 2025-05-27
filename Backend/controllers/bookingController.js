// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        const {
            room,
            checkInDate,
            checkOutDate,
            guests,
            totalPrice,
            paymentMethod,
            specialRequests,
            customerName,
            customerEmail,
            customerIdNumber,
            createdBy
        } = req.body;

        // Validate required fields
        if (!room || !checkInDate || !checkOutDate || !guests || !totalPrice || !paymentMethod || !customerIdNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields including national/passport ID number'
            });
        }

        // Fetch the room to get the real price
        const Room = require('../models/Room');
        const roomDoc = await Room.findById(room);
        if (!roomDoc) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        const roomPrice = roomDoc.price;

        // Create booking
        const booking = await Booking.create({
            user: req.user._id,
            hotel: req.user.hotel,
            room,
            checkInDate,
            checkOutDate,
            guests,
            totalPrice,
            roomPrice,
            paymentMethod,
            specialRequests,
            customerName,
            customerEmail,
            customerIdNumber,
            createdBy
        });

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 