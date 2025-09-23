// Main Express server configuration with security and middleware setup...............          DONE

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const skillRoutes = require('./routes/skills');
const matchRoutes = require('./routes/matches');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware - Helmet for setting various HTTP headers (DONNE)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - prevents brute force attacks  (done)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // Only 5 login attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true,
});

// Apply rate limiting (only in production to avoid 429s during development)
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    app.use('/api/auth', authLimiter);
    app.use('/api/', limiter);
}

// CORS configuarat
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// General middleware
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging for HTTp requests
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes hay asat .... 
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'SkillSwapper Web Application',
        documentation: '/api/docs',
        health: '/api/health'
    });
});

// Error handling middleware (required for ending)
app.use(notFound);
app.use(errorHandler);


// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 SkillSwapper API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);   
    // 

    // --------- port 3000 will be set in production by mistake.. avoid ing this conflict we write the below code   .....



    if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
        throw new Error("FRONTEND_URL must be set in production!");
    }

});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err.message);
    server.close(() => {
        process.exit(1);
    });
});

module.exports = app;