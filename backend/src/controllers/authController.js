
// Authentication controller handling user registration, login, and token verification

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Skill } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Generate JWT token for user
 * @param {number} userId - User ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'skillswapper',
            audience: 'skillswapper-users'
        }
    );
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { name, email, password, bio, location, skills_have, skills_want } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Create user
        const userId = await User.create({
            name,
            email,
            password_hash,
            bio: bio || null,
            location: location || null
        });

        // Process skills if provided
        const processedSkillsHave = [];
        const processedSkillsWant = [];

        if (skills_have && Array.isArray(skills_have)) {
            for (const skillData of skills_have) {
                try {
                    const skill = await Skill.findOrCreate(skillData.name || skillData);
                    await Skill.addToUserHave(
                        userId,
                        skill.id,
                        skillData.level || 'intermediate'
                    );
                    processedSkillsHave.push({
                        id: skill.id,
                        skill_name: skill.skill_name,
                        proficiency_level: skillData.level || 'intermediate'
                    });
                } catch (skillError) {
                    console.error('Error processing skill:', skillData, skillError);
                }
            }
        }

        if (skills_want && Array.isArray(skills_want)) {
            for (const skillData of skills_want) {
                try {
                    const skill = await Skill.findOrCreate(skillData.name || skillData);
                    await Skill.addToUserWant(
                        userId,
                        skill.id,
                        skillData.urgency || 'medium'
                    );
                    processedSkillsWant.push({
                        id: skill.id,
                        skill_name: skill.skill_name,
                        urgency_level: skillData.urgency || 'medium'
                    });
                } catch (skillError) {
                    console.error('Error processing skill:', skillData, skillError);
                }
            }
        }

        // Generate JWT token
        const token = generateToken(userId);

        // Get created user data
        const newUser = await User.findById(userId);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    bio: newUser.bio,
                    location: newUser.location,
                    profile_pic: newUser.profile_pic,
                    skills_have: processedSkillsHave,
                    skills_want: processedSkillsWant,
                    created_at: newUser.created_at
                }
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific database errors
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        // Get user with skills
        const userWithSkills = await User.getWithSkills(user.id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: userWithSkills.id,
                    name: userWithSkills.name,
                    email: userWithSkills.email,
                    bio: userWithSkills.bio,
                    location: userWithSkills.location,
                    profile_pic: userWithSkills.profile_pic,
                    skills_have: userWithSkills.skills_have,
                    skills_want: userWithSkills.skills_want,
                    created_at: userWithSkills.created_at
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify JWT token
 * POST /api/auth/verify
 */
const verifyToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'skillswapper',
            audience: 'skillswapper-users'
        });

        // Get user data
        const user = await User.getWithSkills(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    bio: user.bio,
                    location: user.location,
                    profile_pic: user.profile_pic,
                    skills_have: user.skills_have,
                    skills_want: user.skills_want,
                    created_at: user.created_at
                }
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Token verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Refresh JWT token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Verify existing token (even if expired)
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET, {
                issuer: 'skillswapper',
                audience: 'skillswapper-users'
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                // Allow refresh of expired tokens
                decoded = jwt.decode(token);
            } else {
                throw error;
            }
        }

        // Verify user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new token
        const newToken = generateToken(user.id);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: newToken
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);

        res.status(401).json({
            success: false,
            message: 'Token refresh failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Get user with password hash
        const user = await User.findByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        // Update password in database
        await User.update(userId, { password_hash: newPasswordHash });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password change failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Logout user (client-side token invalidation)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side
        // But we can log the logout event and potentially blacklist tokens
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    register,
    login,
    verifyToken,
    refreshToken,
    changePassword,
    logout
};