// JWT middleware authenticattion

const jwt = require('jsonwebtoken');
const { User } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

//JWT generation 
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'skillswapper',
            audience: 'skillswapper-users',
        }
    );
};

//JWT verification
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'skillswapper',
            audience: 'skillswapper-users',
        });
    } catch (error) {
        return null;
    }
};

//Authentication middleware
const authenticateToken = async (req, res, next) => {
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

        //verify here
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or Expired token',
            });
        }

        //get user + attach to request 
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found, authorization denied',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error',
        });
    }
};

//optional authentication (for publiic endpoints that benefit from knowing user context if available)


const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const user = await User.findById(decoded.userId);
                if (user) {
                    req.user = user;
                }
            }
        }

        next();
    } catch (error) {


        //ignore auth error for optional authentication
        next();
    }
};

// for profile update ,,
//we check if user owns a resource (for profile updates,etc)


const requireOwnership = (req, res, next) => {
    const resourceUserId = parseInt(req.params.id || req.params.userId);
    const currentUserId = req.user.id;

    if (resourceUserId !== currentUserId) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to modify this resource',
        });
    }

    next();
};

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    optionalAuth,
    requireOwnership,
};

