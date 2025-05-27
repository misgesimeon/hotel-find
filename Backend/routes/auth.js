const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    getUsers,
    updateUserRole
} = require('../controllers/auth');
const { protect, authorize } = require('../middleware/auth');

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user
router.get('/me', protect, getMe);

// Get all users (admin only)
router.get('/users', protect, authorize('admin'), getUsers);

// Update user role (admin only)
router.put('/users/:id/role', 
    protect, 
    authorize('admin'),
    async (req, res, next) => {
        try {
            // Validate request body
            if (!req.body.role) {
                return res.status(400).json({
                    success: false,
                    message: 'Role is required'
                });
            }
            next();
        } catch (error) {
            next(error);
        }
    },
    updateUserRole
);

// Forgot password
router.post('/forgotpassword', forgotPassword);

// Reset password
router.put('/resetpassword', resetPassword);

module.exports = router; 