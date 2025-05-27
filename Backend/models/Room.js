const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: [true, 'Hotel reference is required']
    },
    roomNumber: {
        type: String,
        required: [true, 'Room number is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Room type is required'],
        enum: ['Single', 'Double', 'Suite', 'Deluxe', 'Family', 'Executive'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Room description is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Room price is required'],
        min: [0, 'Price cannot be negative']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    capacity: {
        adults: {
            type: Number,
            required: [true, 'Adult capacity is required'],
            min: [1, 'Must have at least 1 adult capacity'],
            default: 1
        },
        children: {
            type: Number,
            required: [true, 'Children capacity is required'],
            min: [0, 'Children capacity cannot be negative'],
            default: 0
        }
    },
    amenities: [{
        type: String,
        trim: true
    }],
    images: [{
        filename: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    bookings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        checkIn: {
            type: Date,
            required: true
        },
        checkOut: {
            type: Date,
            required: true
        },
        guests: {
            adults: {
                type: Number,
                required: true,
                min: 1
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
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ type: 1, price: 1 });

// Virtual for current booking
roomSchema.virtual('currentBooking').get(function() {
    if (!this.bookings || !Array.isArray(this.bookings)) {
        return null;
    }
    const now = new Date();
    return this.bookings.find(booking => 
        booking && booking.status === 'confirmed' &&
        booking.checkIn && booking.checkOut &&
        booking.checkIn <= now &&
        booking.checkOut > now
    );
});

// Virtual for next booking
roomSchema.virtual('nextBooking').get(function() {
    if (!this.bookings || !Array.isArray(this.bookings)) {
        return null;
    }
    const now = new Date();
    return this.bookings
        .filter(booking => 
            booking && 
            booking.status === 'confirmed' && 
            booking.checkIn && 
            booking.checkIn > now
        )
        .sort((a, b) => a.checkIn - b.checkIn)[0];
});

// Virtual for image URLs
roomSchema.virtual('imageUrls').get(function() {
    if (!this.images || !Array.isArray(this.images) || this.images.length === 0) {
        return [];
    }
    return this.images.map(image => {
        if (!image) return null;
        // If it's already a full URL, return it
        if (image.url && image.url.startsWith('http')) {
            return image.url;
        }
        // If it's a blob URL, return the original URL
        if (image.url && image.url.startsWith('blob:')) {
            return image.url;
        }
        // Otherwise, construct the full URL
        const baseUrl = process.env.API_URL || 'http://localhost:5000';
        return `${baseUrl}/uploads/rooms/${image.filename || image}`;
    }).filter(url => url !== null);
});

// Middleware to update the updatedAt field
roomSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Middleware to ensure proper image URLs
roomSchema.pre('save', function(next) {
    if (this.images && this.images.length > 0) {
        this.images = this.images.map(image => {
            // If it's a string, convert to object
            if (typeof image === 'string') {
                const baseUrl = process.env.API_URL || 'http://localhost:5000';
                return {
                    filename: image,
                    url: `${baseUrl}/uploads/rooms/${image}`
                };
            }
            // If it's an object but missing url, add it
            if (image.filename && !image.url) {
                const baseUrl = process.env.API_URL || 'http://localhost:5000';
                return {
                    ...image,
                    url: `${baseUrl}/uploads/rooms/${image.filename}`
                };
            }
            // If it's an object with a relative URL, make it absolute
            if (image.url && image.url.startsWith('/uploads/')) {
                const baseUrl = process.env.API_URL || 'http://localhost:5000';
                return {
                    ...image,
                    url: `${baseUrl}${image.url}`
                };
            }
            return image;
        });
    }
    next();
});

// Add toJSON transform to include virtuals
roomSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

// Instance method to calculate total price for a stay
roomSchema.methods.calculateTotalPrice = function(checkIn, checkOut) {
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return this.price * nights;
};

// Instance method to check if room is available for given dates
roomSchema.methods.isAvailableForDates = function(checkIn, checkOut) {
    // If room is not available at all, return false
    if (!this.isAvailable) {
        return false;
    }

    // Check if there are any confirmed bookings that overlap with the requested dates
    const hasOverlappingBooking = this.bookings.some(booking => {
        if (booking.status !== 'confirmed') return false;
        
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);
        const requestedCheckIn = new Date(checkIn);
        const requestedCheckOut = new Date(checkOut);

        // Check if the requested dates overlap with the booking dates
        return (
            (requestedCheckIn >= bookingCheckIn && requestedCheckIn < bookingCheckOut) || // Check-in date falls within booking
            (requestedCheckOut > bookingCheckIn && requestedCheckOut <= bookingCheckOut) || // Check-out date falls within booking
            (requestedCheckIn <= bookingCheckIn && requestedCheckOut >= bookingCheckOut) // Requested dates completely encompass booking
        );
    });

    return !hasOverlappingBooking;
};

// Instance method to add a booking
roomSchema.methods.addBooking = async function(bookingData) {
    this.bookings.push(bookingData);
    await this.save();
};

// Instance method to remove a booking
roomSchema.methods.removeBooking = async function(bookingId) {
    this.bookings = this.bookings.filter(booking => booking._id.toString() !== bookingId);
    await this.save();
};

// Instance method to update booking status
roomSchema.methods.updateBookingStatus = async function(bookingId, newStatus) {
    const booking = this.bookings.id(bookingId);
    if (booking) {
        booking.status = newStatus;
        await this.save();
    }
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room; 