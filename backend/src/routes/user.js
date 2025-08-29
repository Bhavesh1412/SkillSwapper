// src/routes/users.js
// User profile routes

const express = require('express');
const { User, Document } = require('../models/database');
const { authenticateToken, requireOwnership } = require('../middleware/auth');
const { validateProfileUpdate, validateId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.getWithSkills(req.user.id);
        
        res.json({
            success: true,
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
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID (public view)
// @access  Public
router.get('/profile/:id', validateId, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await User.getWithSkills(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Public profile - don't include email
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
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
        console.error('Get public profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

// @route   PUT /api/users/profile/:id
// @desc    Update user profile
// @access  Private (own profile only)
router.put('/profile/:id', 
    validateId, 
    authenticateToken, 
    requireOwnership, 
    validateProfileUpdate, 
    async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            const { name, bio, location, profile_pic } = req.body;

            // Update user profile
            const updatedUser = await User.update(userId, {
                name,
                bio,
                location,
                profile_pic
            });

            // Get updated user with skills
            const userWithSkills = await User.getWithSkills(userId);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: {
                        id: userWithSkills.id,
                        name: userWithSkills.name,
                        email: userWithSkills.email,
                        bio: userWithSkills.bio,
                        location: userWithSkills.location,
                        profile_pic: userWithSkills.profile_pic,
                        skills_have: userWithSkills.skills_have,
                        skills_want: userWithSkills.skills_want
                    }
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    }
);

// @route   GET /api/users/:id/documents
// @desc    Get user's documents
// @access  Private (own documents only)
router.get('/:id/documents', 
    validateId, 
    authenticateToken, 
    requireOwnership, 
    async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            const documents = await Document.getByUserId(userId);

            res.json({
                success: true,
                data: { documents }
            });
        } catch (error) {
            console.error('Get documents error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch documents'
            });
        }
    }
);

// @route   GET /api/users/search
// @desc    Search users by skills or location
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { skill, location, limit = 20, offset = 0 } = req.query;

        let sql = `
            SELECT DISTINCT u.id, u.name, u.bio, u.location, u.profile_pic,
                   GROUP_CONCAT(DISTINCT s_have.skill_name) as skills_have_names,
                   GROUP_CONCAT(DISTINCT s_want.skill_name) as skills_want_names
            FROM users u
            LEFT JOIN user_skills_have ush ON u.id = ush.user_id
            LEFT JOIN skills s_have ON ush.skill_id = s_have.id
            LEFT JOIN user_skills_want usw ON u.id = usw.user_id
            LEFT JOIN skills s_want ON usw.skill_id = s_want.id
            WHERE 1=1
        `;

        const params = [];

        if (skill) {
            sql += ` AND (s_have.skill_name LIKE ? OR s_want.skill_name LIKE ?)`;
            params.push(`%${skill}%`, `%${skill}%`);
        }

        if (location) {
            sql += ` AND u.location LIKE ?`;
            params.push(`%${location}%`);
        }

        sql += ` GROUP BY u.id ORDER BY u.name LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const { query } = require('../models/database');
        const users = await query(sql, params);

        res.json({
            success: true,
            data: { 
                users,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: users.length
                }
            }
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
});

module.exports = router;