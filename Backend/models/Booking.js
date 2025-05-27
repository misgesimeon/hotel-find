const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    checkInDate: {
        type: Date,
        required: [true, 'Please provide check-in date']
    },
    checkOutDate: {
        type: Date,
        required: [true, 'Please provide check-out date']
    },
    guests: {
        adults: {
            type: Number,
            required: true,
            default: 1
        },
        children: {
            type: Number,
            default: 0
        }
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'confirmed by Hotel', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'completed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'bank_transfer', 'cash', 'telebirr'],
        required: true
    },
    specialRequests: String,
    customerName: { type: String },
    customerEmail: { type: String },
    customerIdNumber: { 
        type: String,
        required: [true, 'National/Passport ID number is required'],
        trim: true
    },
    roomPrice: {
        type: Number,
        required: true,
        min: 0
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', bookingSchema); 