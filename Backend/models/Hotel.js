const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Hotel name is required'],
        trim: true,
        maxlength: [100, 'Hotel name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Hotel description is required'],
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
        address: {
            type: String,
            required: [true, 'Hotel location address is required'],
            trim: true
        }
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Hotel manager is required']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'Ethiopia'
        }
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    price: {
        type: Number,
        required: [true, 'Price per night is required'],
        min: [0, 'Price cannot be negative']
    },
    rating: {
        type: Number,
        min: [0, 'Rating must be at least 0'],
        max: [5, 'Rating cannot exceed 5'],
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    amenities: [{
        type: String,
        trim: true
    }],
    image: {
        type: String,
        default: 'default-hotel.jpg'
    },
    images: [{
        type: mongoose.Schema.Types.Mixed,
        validate: {
            validator: function(v) {
                // Allow both string and object formats
                if (typeof v === 'string') return true;
                if (typeof v === 'object' && v !== null) {
                    return v.filename && v.url;
                }
                return false;
            },
            message: 'Image must be either a string or an object with filename and url properties'
        }
    }],
    rooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }],
    contact: {
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        website: {
            type: String,
            trim: true
        }
    },
    policies: {
        checkIn: {
            type: String,
            default: '14:00'
        },
        checkOut: {
            type: String,
            default: '12:00'
        },
        cancellation: {
            type: String,
            default: 'Free cancellation up to 24 hours before check-in'
        }
    },
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

// Virtual for average room price
hotelSchema.virtual('averageRoomPrice').get(function() {
    if (!this.rooms || this.rooms.length === 0) return this.price;
    const total = this.rooms.reduce((sum, room) => sum + room.price, 0);
    return total / this.rooms.length;
});

// Indexes for better query performance
hotelSchema.index({ name: 'text', description: 'text', location: 'text' });
hotelSchema.index({ price: 1 });
hotelSchema.index({ rating: -1 });

// Middleware to update the updatedAt field
hotelSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Middleware to ensure proper image URLs
hotelSchema.pre('save', function(next) {
    // Handle main image
    if (this.image) {
        if (typeof this.image === 'string') {
            const baseUrl = process.env.API_URL || 'http://localhost:5000';
            this.image = `${baseUrl}/uploads/hotels/${this.image}`;
        }
    }

    // Handle additional images
    if (this.images && this.images.length > 0) {
        this.images = this.images.map(image => {
            // If it's a string, convert to object
            if (typeof image === 'string') {
                const baseUrl = process.env.API_URL || 'http://localhost:5000';
                return {
                    filename: image,
                    url: `${baseUrl}/uploads/hotels/${image}`
                };
            }
            // If it's an object but missing url, add it
            if (image.filename && !image.url) {
                const baseUrl = process.env.API_URL || 'http://localhost:5000';
                return {
                    ...image,
                    url: `${baseUrl}/uploads/hotels/${image.filename}`
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

// Static method to search hotels
hotelSchema.statics.search = async function(query) {
    return this.find({
        $text: { $search: query },
        isActive: true
    })
    .sort({ rating: -1, price: 1 })
    .select('name description location price rating image');
};

// Instance method to get available rooms
hotelSchema.methods.getAvailableRooms = async function(checkIn, checkOut) {
    const Room = mongoose.model('Room');
    return Room.find({
        hotel: this._id,
        isAvailable: true,
        $or: [
            { bookings: { $size: 0 } },
            {
                bookings: {
                    $not: {
                        $elemMatch: {
                            checkIn: { $lt: checkOut },
                            checkOut: { $gt: checkIn }
                        }
                    }
                }
            }
        ]
    });
};

// Static method to get featured hotels
hotelSchema.statics.getFeaturedHotels = async function(limit = 6) {
    return this.find({
        isFeatured: true,
        isActive: true
    })
    .sort({ rating: -1, price: 1 })
    .limit(limit)
    .select('name description location price rating image images');
};

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel; 