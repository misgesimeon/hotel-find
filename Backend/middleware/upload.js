const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = ['uploads', 'uploads/rooms', 'uploads/hotels'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Create upload directories
createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine the destination based on the route
        const isHotelRoute = req.originalUrl.includes('/hotels/');
        const isRoomRoute = req.originalUrl.includes('/rooms/');
        
        if (isHotelRoute) {
            cb(null, 'uploads/hotels/');
        } else if (isRoomRoute) {
            cb(null, 'uploads/rooms/');
        } else {
            cb(null, 'uploads/');
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Helper function to get file URL
const getFileUrl = (req, filename) => {
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const isHotelRoute = req.originalUrl.includes('/hotels/');
    const isRoomRoute = req.originalUrl.includes('/rooms/');
    
    if (isHotelRoute) {
        return `${baseUrl}/uploads/hotels/${filename}`;
    } else if (isRoomRoute) {
        return `${baseUrl}/uploads/rooms/${filename}`;
    }
    // Default to hotel images for backward compatibility
    return `${baseUrl}/uploads/hotels/${filename}`;
};

// Middleware for single image upload
exports.uploadSingle = (fieldName) => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, function(err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err.message
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err
                });
            }
            
            // Add file URL to request
            if (req.file) {
                req.file.url = getFileUrl(req, req.file.filename);
            }
            
            next();
        });
    };
};

// Middleware for multiple image upload
exports.uploadMultiple = (fieldName, maxCount) => {
    return (req, res, next) => {
        console.log('Upload request received:', {
            body: req.body,
            headers: req.headers,
            params: req.params,
            url: req.originalUrl
        });

        // Check for ID before attempting upload
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'ID is required'
            });
        }

        upload.array(fieldName, maxCount)(req, res, function(err) {
            if (err instanceof multer.MulterError) {
                console.error('Multer error:', err);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File size too large. Maximum size is 5MB per file.'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err.message
                });
            } else if (err) {
                console.error('Upload error:', err);
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err
                });
            }

            // Only process files if they exist
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    file.url = getFileUrl(req, file.filename);
                });
                console.log('Files uploaded successfully:', req.files);
            }
            
            next();
        });
    };
};

// Middleware for multiple fields upload
exports.uploadFields = (fields) => {
    return (req, res, next) => {
        upload.fields(fields)(req, res, function(err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err.message
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err
                });
            }
            
            // Add file URLs to request
            if (req.files) {
                Object.keys(req.files).forEach(field => {
                    req.files[field].forEach(file => {
                        file.url = getFileUrl(req, file.filename);
                    });
                });
            }
            
            next();
        });
    };
};

module.exports = upload; 