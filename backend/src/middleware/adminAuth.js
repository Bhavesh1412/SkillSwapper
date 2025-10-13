// Admin authentication middleware

const jwt = require('jsonwebtoken');
const { User } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Admin credentials (in production, store in environment variables)
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Pass@1234';

// Check if user is admin
const isAdmin = (user) => {
    return user && user.email === ADMIN_EMAIL;
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        // Get token from headers
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided, authorization denied',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'skillswapper',
            audience: 'skillswapper-users',
        });

        // Get user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found, authorization denied',
            });
        }

        // Check if user is admin
        if (!isAdmin(user)) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
        }

        req.user = user;
        req.isAdmin = true;
        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};

// Admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials',
            });
        }

        // Get admin user from database or create if doesn't exist
        let adminUser = await User.findByEmail(ADMIN_EMAIL);
        if (!adminUser) {
            // Create admin user if doesn't exist
            const bcrypt = require('bcryptjs');
            const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
            
            const adminId = await User.create({
                name: 'Admin',
                email: ADMIN_EMAIL,
                password_hash,
                bio: 'System Administrator',
                location: 'System'
            });
            adminUser = await User.findById(adminId);
        }

        // Generate token
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        const token = jwt.sign(
            { userId: adminUser.id },
            JWT_SECRET,
            {
                expiresIn: '24h',
                issuer: 'skillswapper',
                audience: 'skillswapper-users',
            }
        );

        res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                token,
                user: {
                    id: adminUser.id,
                    name: adminUser.name,
                    email: adminUser.email,
                    isAdmin: true
                }
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Admin login failed',
        });
    }
};

module.exports = {
    authenticateAdmin,
    adminLogin,
    isAdmin,
    ADMIN_EMAIL,
    ADMIN_PASSWORD
};

