const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    idNumber: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin', 'hotel_manager'],
            message: 'Role must be either user, admin, or hotel_manager'
        },
        default: 'user'
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number']
    },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(this.password, salt);
        this.password = hash;
        next();
    } catch (error) {
        next(error);
    }
});

// Password verification method
userSchema.methods.verifyPassword = async function(password) {
    if (!password || !this.password) {
        console.log('Password verification failed: missing password or hashed password');
        return false;
    }
    console.log('Comparing passwords...');
    const result = await bcrypt.compare(password, this.password);
    console.log('Password comparison result:', result);
    return result;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 