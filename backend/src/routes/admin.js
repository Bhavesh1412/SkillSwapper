// Admin routes for user management

const express = require('express');
const { User, Match, Notification, query } = require('../models/database');
const { authenticateAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
    const { adminLogin } = require('../middleware/adminAuth');
    return adminLogin(req, res);
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT id, name, email, bio, location, profile_pic, created_at,
                   (SELECT COUNT(*) FROM matches WHERE user1_id = u.id OR user2_id = u.id) as total_matches,
                   (SELECT COUNT(*) FROM matches WHERE (user1_id = u.id OR user2_id = u.id) AND status = 'accepted') as accepted_matches
            FROM users u
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.bio LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const users = await query(sql, params);

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM users u WHERE 1=1';
        const countParams = [];
        if (search) {
            countSql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.bio LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [{ total }] = await query(countSql, countParams);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total: parseInt(total),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details with skills and matches
// @access  Admin
router.get('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Get user with skills
        const user = await User.getWithSkills(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's matches
        const matchesSql = `
            SELECT m.*, 
                   CASE 
                       WHEN m.user1_id = ? THEN u2.name
                       ELSE u1.name 
                   END as other_user_name,
                   CASE 
                       WHEN m.user1_id = ? THEN u2.profile_pic
                       ELSE u1.profile_pic 
                   END as other_user_pic
            FROM matches m
            JOIN users u1 ON m.user1_id = u1.id
            JOIN users u2 ON m.user2_id = u2.id
            WHERE m.user1_id = ? OR m.user2_id = ?
            ORDER BY m.created_at DESC
        `;
        const matches = await query(matchesSql, [userId, userId, userId, userId]);

        res.json({
            success: true,
            data: {
                user,
                matches
            }
        });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details'
        });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user and all related data
// @access  Admin
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin account'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete all related data in correct order
        await query('DELETE FROM notifications WHERE user_id = ? OR from_user_id = ?', [userId, userId]);
        await query('DELETE FROM matches WHERE user1_id = ? OR user2_id = ?', [userId, userId]);
        await query('DELETE FROM user_skills_have WHERE user_id = ?', [userId]);
        await query('DELETE FROM user_skills_want WHERE user_id = ?', [userId]);
        await query('DELETE FROM documents WHERE user_id = ?', [userId]);
        await query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

// @route   POST /api/admin/users/:id/warning
// @desc    Send warning to user
// @access  Admin
router.post('/users/:id/warning', authenticateAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { message, type = 'warning' } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Warning message is required'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create warning notification
        await Notification.create({
            user_id: userId,
            from_user_id: req.user.id,
            type: 'admin_warning',
            title: 'Admin Warning',
            message: message,
            data: {
                warningType: type,
                fromAdmin: {
                    id: req.user.id,
                    name: req.user.name
                }
            }
        });

        res.json({
            success: true,
            message: 'Warning sent successfully'
        });
    } catch (error) {
        console.error('Send warning error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send warning'
        });
    }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        // Get basic stats
        const [totalUsers] = await query('SELECT COUNT(*) as count FROM users');
        const [totalMatches] = await query('SELECT COUNT(*) as count FROM matches');
        const [acceptedMatches] = await query('SELECT COUNT(*) as count FROM matches WHERE status = "accepted"');
        const [pendingMatches] = await query('SELECT COUNT(*) as count FROM matches WHERE status = "pending"');

        // Get recent users (last 7 days)
        const [recentUsers] = await query(`
            SELECT COUNT(*) as count FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        // Get top skills
        const topSkills = await query(`
            SELECT s.skill_name, COUNT(*) as count
            FROM user_skills_have ush
            JOIN skills s ON ush.skill_id = s.id
            GROUP BY s.id, s.skill_name
            ORDER BY count DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                totalUsers: totalUsers.count,
                totalMatches: totalMatches.count,
                acceptedMatches: acceptedMatches.count,
                pendingMatches: pendingMatches.count,
                recentUsers: recentUsers.count,
                topSkills
            }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin statistics'
        });
    }
});

module.exports = router;

