const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createDefaultAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking');
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'misganaw@gmail.com' });
        if (existingAdmin) {
            console.log('Admin account already exists');
            process.exit(0);
        }

        // Create admin user
        const admin = new User({
            name: 'misge',
            email: 'misganaw@gmail.com',
            password: '123123',
            role: 'admin',
            phone: '1234567890', // Default phone number
            isActive: true
        });

        await admin.save();
        console.log('Default admin account created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin account:', error);
        process.exit(1);
    }
};

createDefaultAdmin(); 