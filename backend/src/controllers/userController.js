// User management controller for profile operations and user data

const { User, Document, query } = require('../models/database');
const path = require('path');

/**
 * Get current user's profile
 * GET /api/users/me
 */
const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.getWithSkills(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

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
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user profile by ID (public view)
 * GET /api/users/profile/:id
 */
const getUserProfile = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const currentUserId = req.user?.id; // May be undefined for public access

        if (isNaN(userId) || userId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const user = await User.getWithSkills(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Public profile - don't include email unless it's the user's own profile
        const profileData = {
            id: user.id,
            name: user.name,
            bio: user.bio,
            location: user.location,
            profile_pic: user.profile_pic,
            skills_have: user.skills_have,
            skills_want: user.skills_want,
            created_at: user.created_at
        };

        // Include email if viewing own profile
        if (currentUserId === userId) {
            profileData.email = user.email;
        }

        res.json({
            success: true,
            data: { user: profileData }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update user profile
 * PUT /api/users/profile/:id
 */
const updateUserProfile = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, bio, location, profile_pic } = req.body;

        // Verify user can only update their own profile
        if (userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You can only update your own profile'
            });
        }

        // Prepare update data - only include defined fields
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (location !== undefined) updateData.location = location;
        if (profile_pic !== undefined) updateData.profile_pic = profile_pic;

        // Update user profile
        const updatedUser = await User.update(userId, updateData);

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
        
        if (error.message === 'No valid fields to update') {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user's documents
 * GET /api/users/:id/documents
 */
const getUserDocuments = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Verify user can only access their own documents
        if (userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You can only access your own documents'
            });
        }

        const documents = await Document.getByUserId(userId);

        res.json({
            success: true,
            data: { documents }
        });

    } catch (error) {
        console.error('Get user documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Search users by skills, location, or name
 * GET /api/users/search
 */
const searchUsers = async (req, res) => {
    try {
        const {
            skill,
            location,
            name,
            limit = 20,
            offset = 0,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Validate pagination parameters
        const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
        const offsetNum = Math.max(parseInt(offset) || 0, 0);

        // Validate sort parameters
        const validSortFields = ['name', 'created_at', 'location'];
        const validSortOrders = ['asc', 'desc'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
        const sortDirection = validSortOrders.includes(sortOrder?.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';

        // Build search query
        let sql = `
            SELECT DISTINCT u.id, u.name, u.bio, u.location, u.profile_pic, u.created_at,
                   GROUP_CONCAT(DISTINCT s_have.skill_name ORDER BY s_have.skill_name) as skills_have_names,
                   GROUP_CONCAT(DISTINCT s_want.skill_name ORDER BY s_want.skill_name) as skills_want_names
            FROM users u
            LEFT JOIN user_skills_have ush ON u.id = ush.user_id
            LEFT JOIN skills s_have ON ush.skill_id = s_have.id
            LEFT JOIN user_skills_want usw ON u.id = usw.user_id
            LEFT JOIN skills s_want ON usw.skill_id = s_want.id
            WHERE 1=1
        `;

        const params = [];

        // Add search conditions
        if (skill) {
            sql += ` AND (s_have.skill_name LIKE ? OR s_want.skill_name LIKE ?)`;
            params.push(`%${skill}%`, `%${skill}%`);
        }

        if (location) {
            sql += ` AND u.location LIKE ?`;
            params.push(`%${location}%`);
        }

        if (name) {
            sql += ` AND u.name LIKE ?`;
            params.push(`%${name}%`);
        }

        // Exclude current user from search results if logged in
        if (req.user?.id) {
            sql += ` AND u.id != ?`;
            params.push(req.user.id);
        }

        // Group by user and add sorting
        sql += ` GROUP BY u.id ORDER BY u.${sortField} ${sortDirection.toUpperCase()} LIMIT ? OFFSET ?`;
        params.push(limitNum, offsetNum);

        const users = await query(sql, params);

        // Get total count for pagination
        let countSql = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            LEFT JOIN user_skills_have ush ON u.id = ush.user_id
            LEFT JOIN skills s_have ON ush.skill_id = s_have.id
            LEFT JOIN user_skills_want usw ON u.id = usw.user_id
            LEFT JOIN skills s_want ON usw.skill_id = s_want.id
            WHERE 1=1
        `;

        const countParams = [];
        
        if (skill) {
            countSql += ` AND (s_have.skill_name LIKE ? OR s_want.skill_name LIKE ?)`;
            countParams.push(`%${skill}%`, `%${skill}%`);
        }

        if (location) {
            countSql += ` AND u.location LIKE ?`;
            countParams.push(`%${location}%`);
        }

        if (name) {
            countSql += ` AND u.name LIKE ?`;
            countParams.push(`%${name}%`);
        }

        if (req.user?.id) {
            countSql += ` AND u.id != ?`;
            countParams.push(req.user.id);
        }

        const [{ total }] = await query(countSql, countParams);

        // Process results to format skills
        const processedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            bio: user.bio,
            location: user.location,
            profile_pic: user.profile_pic,
            created_at: user.created_at,
            skills_have: user.skills_have_names ? user.skills_have_names.split(',') : [],
            skills_want: user.skills_want_names ? user.skills_want_names.split(',') : []
        }));

        res.json({
            success: true,
            data: {
                users: processedUsers,
                pagination: {
                    limit: limitNum,
                    offset: offsetNum,
                    total: parseInt(total),
                    hasMore: offsetNum + limitNum < total,
                    totalPages: Math.ceil(total / limitNum),
                    currentPage: Math.floor(offsetNum / limitNum) + 1
                },
                searchParams: {
                    skill,
                    location,
                    name,
                    sortBy: sortField,
                    sortOrder: sortDirection
                }
            }
        });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user statistics
 * GET /api/users/:id/stats
 */
const getUserStats = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Users can view their own stats or public basic stats of others
        const isOwnProfile = req.user?.id === userId;

        // Get user's basic info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get skills count
        const skillsHaveCount = await query(
            'SELECT COUNT(*) as count FROM user_skills_have WHERE user_id = ?',
            [userId]
        );

        const skillsWantCount = await query(
            'SELECT COUNT(*) as count FROM user_skills_want WHERE user_id = ?',
            [userId]
        );

        const stats = {
            skillsCanTeach: skillsHaveCount[0].count,
            skillsWantToLearn: skillsWantCount[0].count,
            profileCompleteness: calculateProfileCompleteness(user),
            memberSince: user.created_at
        };

        // Add private stats for own profile
        if (isOwnProfile) {
            // Get document count
            const documentCount = await query(
                'SELECT COUNT(*) as count FROM documents WHERE user_id = ?',
                [userId]
            );

            // Get potential matches count (simplified)
            const matchesCount = await query(`
                SELECT COUNT(DISTINCT other_user.id) as count
                FROM users other_user
                JOIN user_skills_want usw ON other_user.id = usw.user_id
                JOIN user_skills_have ush_current ON usw.skill_id = ush_current.skill_id AND ush_current.user_id = ?
                JOIN user_skills_have ush ON other_user.id = ush.user_id  
                JOIN user_skills_want usw_current ON ush.skill_id = usw_current.skill_id AND usw_current.user_id = ?
                WHERE other_user.id != ?
            `, [userId, userId, userId]);

            stats.documentsUploaded = documentCount[0].count;
            stats.potentialMatches = matchesCount[0].count;
        }

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Calculate profile completeness percentage
 * @param {Object} user - User object
 * @returns {number} Completeness percentage
 */
const calculateProfileCompleteness = (user) => {
    let completeness = 0;
    const fields = [
        'name',      // Required - always present
        'email',     // Required - always present  
        'bio',
        'location',
        'profile_pic'
    ];

    fields.forEach(field => {
        if (user[field] && user[field].trim() !== '') {
            completeness += 20; // Each field is worth 20%
        }
    });

    return Math.min(completeness, 100);
};

/**
 * Delete user account
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Verify user can only delete their own account
        if (userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You can only delete your own account'
            });
        }

        // Note: Due to CASCADE constraints in the database schema,
        // deleting the user will automatically delete all related records
        await query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getMe,
    getUserProfile,
    updateUserProfile,
    getUserDocuments,
    searchUsers,
    getUserStats,
    deleteUser
};