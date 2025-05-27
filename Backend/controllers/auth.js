const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Register new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, phone, idNumber } = req.body;

        // Validate required fields
        if (!name || !email || !password || !phone || !idNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields (name, email, password, phone, idNumber)'
            });
        }

        console.log('Registration attempt for email:', email);
        console.log('Raw password length:', password.length);

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            phone,
            idNumber,
            role: role || 'user'
        });

        // Save user - password will be hashed by the pre-save middleware
        await user.save();
        console.log('User registered successfully. Hashed password length:', user.password.length);

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'default_secret_key',
            { expiresIn: '30d' }
        );

        // Try to send welcome email if email config is available
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Welcome to Hotel Recommender',
                    html: `
                        <h1>Welcome ${name}!</h1>
                        <p>Thank you for registering with Hotel Recommender.</p>
                        <p>You can now book hotels and manage your reservations.</p>
                    `
                };
                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
                // Continue with registration even if email fails
            }
        }

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                idNumber: user.idNumber,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt received:', { email, password: password ? '***' : 'missing' });

        // Validate required fields
        if (!email || !password) {
            console.log('Login attempt missing required fields:', { email: !!email, password: !!password });
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email and include password field
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('User found:', { 
            id: user._id, 
            email: user.email, 
            isActive: user.isActive,
            hasPassword: !!user.password
        });

        // Check if user is active
        if (!user.isActive) {
            console.log('Login attempt for deactivated account:', email);
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        console.log('Attempting password verification...');
        const isValidPassword = await user.verifyPassword(password);
        console.log('Password verification result:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'default_secret_key',
            { expiresIn: '30d' }
        );

        // Remove password from user object
        user.password = undefined;

        console.log('Successful login for user:', email);

        // Send success response
        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error occurred during login'
        });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Password reset email sent'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findOne({
            _id: decoded.id,
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        console.log('getMe called for user:', req.user.id);
        
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate({
                path: 'hotel',
                select: 'name address city state country'
            });

        if (!user) {
            console.log('User not found for ID:', req.user.id);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('User found:', {
            id: user._id,
            email: user.email,
            role: user.role,
            hotel: user.hotel ? {
                id: user.hotel._id,
                name: user.hotel.name
            } : 'No hotel assigned'
        });

        // For hotel managers, ensure they have a hotel assigned
        if (user.role === 'hotel_manager') {
            // Find hotel where this user is the manager
            const Hotel = mongoose.model('Hotel');
            const managerHotel = await Hotel.findOne({ manager: user._id });
            
            console.log('Manager hotel search result:', managerHotel ? {
                id: managerHotel._id,
                name: managerHotel.name
            } : 'No hotel found');

            if (!managerHotel) {
                console.log('Hotel manager has no hotel assigned:', user._id);
                return res.status(403).json({
                    success: false,
                    message: 'No hotel assigned. Please contact the administrator to be assigned to a hotel.'
                });
            }

            // Update user's hotel reference
            user.hotel = managerHotel;
            await user.save();
        }

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                hotel: user.hotel ? {
                    _id: user.hotel._id,
                    name: user.hotel.name,
                    address: user.hotel.address,
                    city: user.hotel.city,
                    state: user.hotel.state,
                    country: user.hotel.country
                } : null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Error in getMe:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all users (admin only)
exports.getUsers = async (req, res) => {
    try {
        console.log('getUsers called by user:', req.user);
        
        if (!req.user || req.user.role !== 'admin') {
            console.log('Unauthorized access attempt');
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this resource'
            });
        }

        const users = await User.find().select('-password');
        console.log('Found users:', users.length);
        
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
    try {
        console.log('Updating user role:', {
            userId: req.params.id,
            newRole: req.body.role,
            currentUser: req.user._id
        });

        const { role } = req.body;
        
        if (!role || !['user', 'admin', 'hotel_manager'].includes(role)) {
            console.log('Invalid role provided:', role);
            return res.status(400).json({
                success: false,
                message: 'Invalid role provided'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            console.log('User not found:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent changing own role
        if (user._id.toString() === req.user._id.toString()) {
            console.log('Attempt to change own role blocked');
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role'
            });
        }

        // Update the role
        user.role = role;
        await user.save();

        console.log('Role updated successfully:', {
            userId: user._id,
            newRole: user.role
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error in updateUserRole:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update user role'
        });
    }
};