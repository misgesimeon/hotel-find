const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');
const roomRoutes = require('./routes/rooms');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: true, // Allow all origins during debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Configure helmet for static files
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false // Disable CSP during debugging
}));

app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 100, // More requests allowed in development
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Serve static files
// Add specific route for hotel images
app.use('/uploads/hotels', express.static(path.join(__dirname, 'uploads/hotels'), {
    setHeaders: (res, path) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://front-end-atrw.onrender.com');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
    index: false,
    dotfiles: 'allow'
}));

// Add specific route for room images
app.use('/uploads/rooms', express.static(path.join(__dirname, 'uploads/rooms'), {
    setHeaders: (res, path) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://front-end-atrw.onrender.com');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
    index: false,
    dotfiles: 'allow'
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mis:mis123@cluster0.c2up9.mongodb.net/h1', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Connection string:', process.env.MONGODB_URI || 'mongodb+srv://mis:mis123@cluster0.c2up9.mongodb.net/h1');
    process.exit(1);
});

// Mount routes
app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/auth', authRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    const staticPath = path.join(__dirname, '..', 'client', 'build');
    console.log('Static files path:', staticPath);
    
    // Check if the build directory exists
    if (fs.existsSync(staticPath)) {
        console.log('Build directory exists');
        app.use(express.static(staticPath));
        
        app.get('*', (req, res) => {
            const indexPath = path.join(staticPath, 'index.html');
            console.log('Serving index.html from:', indexPath);
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                console.error('index.html not found at:', indexPath);
                res.status(404).send('Frontend build not found');
            }
        });
    } else {
        console.error('Build directory not found at:', staticPath);
        // Serve a basic error page
        app.get('*', (req, res) => {
            res.status(404).send('Frontend build not found. Please check the build process.');
        });
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
    });
    
    res.status(500).json({
        success: false,
        message: err.message || 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 
