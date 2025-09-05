// src/controllers/matchController.js
// Matching system controller for finding and managing skill matches

const { Match, User, query } = require('../models/database');

/**
 * Get recommended matches for current user
 * GET /api/matches
 */
const getMatches = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            limit = 10, 
            offset = 0, 
            minScore = 1,
            location,
            skill 
        } = req.query;

        // Validate pagination parameters
        const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
        const offsetNum = Math.max(parseInt(offset) || 0, 0);
        const minScoreNum = Math.max(parseInt(minScore) || 1, 1);

        // Build the matching query with optional filters
        let sql = `
            SELECT DISTINCT 
                u.id,
                u.name,
                u.bio,
                u.location,
                u.profile_pic,
                u.created_at,
                GROUP_CONCAT(DISTINCT s_common_have.skill_name) as matching_skills_i_have,
                GROUP_CONCAT(DISTINCT s_common_want.skill_name) as matching_skills_i_want,
                COUNT(DISTINCT s_common_have.id) as skills_i_can_teach_them,
                COUNT(DISTINCT s_common_want.id) as skills_they_can_teach_me
            FROM users u
            -- Find users who want skills that current user has
            JOIN user_skills_want usw ON u.id = usw.user_id
            JOIN user_skills_have ush_current ON usw.skill_id = ush_current.skill_id AND ush_current.user_id = ?
            JOIN skills s_common_have ON ush_current.skill_id = s_common_have.id
            -- And who have skills that current user wants
            JOIN user_skills_have ush ON u.id = ush.user_id
            JOIN user_skills_want usw_current ON ush.skill_id = usw_current.skill_id AND usw_current.user_id = ?
            JOIN skills s_common_want ON ush.skill_id = s_common_want.id
            WHERE u.id != ?
        `;

        const params = [userId, userId, userId];

        // Add location filter if specified
        if (location && location.trim()) {
            sql += ' AND u.location LIKE ?';
            params.push(`%${location.trim()}%`);
        }

        // Add skill filter if specified
        if (skill && skill.trim()) {
            sql += ` AND (s_common_have.skill_name LIKE ? OR s_common_want.skill_name LIKE ?)`;
            params.push(`%${skill.trim()}%`, `%${skill.trim()}%`);
        }

        sql += `
            GROUP BY u.id
            HAVING skills_i_can_teach_them >= ? AND skills_they_can_teach_me >= ?
            ORDER BY (skills_i_can_teach_them + skills_they_can_teach_me) DESC, u.name ASC
            LIMIT ? OFFSET ?
        `;

        params.push(minScoreNum, minScoreNum, limitNum, offsetNum);

        const matches = await query(sql, params);

        // Process matches to include detailed match information
        const processedMatches = matches.map(match => {
            const skillsIHave = match.matching_skills_i_have ? 
                match.matching_skills_i_have.split(',') : [];
            const skillsIWant = match.matching_skills_i_want ? 
                match.matching_skills_i_want.split(',') : [];

            return {
                user: {
                    id: match.id,
                    name: match.name,
                    bio: match.bio,
                    location: match.location,
                    profile_pic: match.profile_pic,
                    created_at: match.created_at
                },
                matchDetails: {
                    skillsYouCanTeachThem: skillsIHave,
                    skillsTheyCanTeachYou: skillsIWant,
                    matchScore: parseInt(match.skills_i_can_teach_them) + parseInt(match.skills_they_can_teach_me),
                    mutualSkillsCount: Math.min(skillsIHave.length, skillsIWant.length),
                    compatibility: calculateCompatibility(skillsIHave.length, skillsIWant.length)
                }
            };
        });

        // Get total count for pagination
        let countSql = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            JOIN user_skills_want usw ON u.id = usw.user_id
            JOIN user_skills_have ush_current ON usw.skill_id = ush_current.skill_id AND ush_current.user_id = ?
            JOIN user_skills_have ush ON u.id = ush.user_id
            JOIN user_skills_want usw_current ON ush.skill_id = usw_current.skill_id AND usw_current.user_id = ?
            WHERE u.id != ?
        `;

        const countParams = [userId, userId, userId];

        if (location && location.trim()) {
            countSql += ' AND u.location LIKE ?';
            countParams.push(`%${location.trim()}%`);
        }

        if (skill && skill.trim()) {
            countSql += ` AND EXISTS (
                SELECT 1 FROM skills s 
                WHERE s.skill_name LIKE ? 
                AND (s.id IN (SELECT skill_id FROM user_skills_have WHERE user_id = ush_current.user_id)
                     OR s.id IN (SELECT skill_id FROM user_skills_have WHERE user_id = u.id))
            )`;
            countParams.push(`%${skill.trim()}%`);
        }

        const [{ total }] = await query(countSql, countParams);

        res.json({
            success: true,
            data: {
                matches: processedMatches,
                pagination: {
                    total: parseInt(total),
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: offsetNum + limitNum < total,
                    totalPages: Math.ceil(total / limitNum),
                    currentPage: Math.floor(offsetNum / limitNum) + 1
                },
                filters: {
                    minScore: minScoreNum,
                    location: location || null,
                    skill: skill || null
                }
            }
        });

    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch matches',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get detailed match information between current user and specific user
 * GET /api/matches/detailed/:userId
 */
const getDetailedMatch = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = parseInt(req.params.userId);

        if (isNaN(targetUserId) || targetUserId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        if (currentUserId === targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot match with yourself'
            });
        }

        // Get both users with their skills
        const [currentUser, targetUser] = await Promise.all([
            User.getWithSkills(currentUserId),
            User.getWithSkills(targetUserId)
        ]);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Target user not found'
            });
        }

        // Calculate detailed match information
        const currentUserHaveSkills = currentUser.skills_have?.map(s => s.skill_name.toLowerCase()) || [];
        const currentUserWantSkills = currentUser.skills_want?.map(s => s.skill_name.toLowerCase()) || [];
        const targetUserHaveSkills = targetUser.skills_have?.map(s => s.skill_name.toLowerCase()) || [];
        const targetUserWantSkills = targetUser.skills_want?.map(s => s.skill_name.toLowerCase()) || [];

        // Find overlapping skills with detailed information
        const skillsYouCanTeachThem = currentUser.skills_have?.filter(skill => 
            targetUserWantSkills.includes(skill.skill_name.toLowerCase())
        ).map(skill => ({
            ...skill,
            demandLevel: targetUser.skills_want?.find(s => 
                s.skill_name.toLowerCase() === skill.skill_name.toLowerCase()
            )?.urgency_level || 'medium'
        })) || [];

        const skillsTheyCanTeachYou = targetUser.skills_have?.filter(skill => 
            currentUserWantSkills.includes(skill.skill_name.toLowerCase())
        ).map(skill => ({
            ...skill,
            yourInterestLevel: currentUser.skills_want?.find(s => 
                s.skill_name.toLowerCase() === skill.skill_name.toLowerCase()
            )?.urgency_level || 'medium'
        })) || [];

        // Calculate match metrics
        const matchScore = skillsYouCanTeachThem.length + skillsTheyCanTeachYou.length;
        const isValidMatch = skillsYouCanTeachThem.length > 0 && skillsTheyCanTeachYou.length > 0;
        const compatibility = calculateCompatibility(skillsYouCanTeachThem.length, skillsTheyCanTeachYou.length);

        // Calculate skill level compatibility
        const skillLevelCompatibility = calculateSkillLevelCompatibility(
            skillsYouCanTeachThem,
            skillsTheyCanTeachYou
        );

        res.json({
            success: true,
            data: {
                targetUser: {
                    id: targetUser.id,
                    name: targetUser.name,
                    bio: targetUser.bio,
                    location: targetUser.location,
                    profile_pic: targetUser.profile_pic,
                    skills_have: targetUser.skills_have,
                    skills_want: targetUser.skills_want,
                    created_at: targetUser.created_at
                },
                matchAnalysis: {
                    isValidMatch,
                    matchScore,
                    compatibility,
                    skillLevelCompatibility,
                    skillsYouCanTeachThem,
                    skillsTheyCanTeachYou,
                    mutualBenefit: {
                        yourSkillsTheyWant: skillsYouCanTeachThem.length,
                        theirSkillsYouWant: skillsTheyCanTeachYou.length,
                        balanceScore: Math.abs(skillsYouCanTeachThem.length - skillsTheyCanTeachYou.length)
                    },
                    recommendations: generateMatchRecommendations(
                        skillsYouCanTeachThem,
                        skillsTheyCanTeachYou,
                        currentUser,
                        targetUser
                    )
                }
            }
        });

    } catch (error) {
        console.error('Get detailed match error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get match details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Save a potential match for future reference
 * POST /api/matches/save
 */
const saveMatch = async (req, res) => {
    try {
        const user1Id = req.user.id;
        const { user2Id, note } = req.body;

        if (!user2Id) {
            return res.status(400).json({
                success: false,
                message: 'Target user ID is required'
            });
        }

        const targetUserId = parseInt(user2Id);
        if (isNaN(targetUserId) || targetUserId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target user ID'
            });
        }

        if (user1Id === targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot match with yourself'
            });
        }

        // Verify target user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Target user not found'
            });
        }

        // Check if match already exists
        const existingMatch = await query(
            'SELECT * FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
            [user1Id, targetUserId, targetUserId, user1Id]
        );

        if (existingMatch.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Match already exists',
                data: {
                    matchId: existingMatch[0].id,
                    status: existingMatch[0].status
                }
            });
        }

        // Calculate matched skills
        const currentUser = await User.getWithSkills(user1Id);
        const targetUserWithSkills = await User.getWithSkills(targetUserId);

        const currentUserHaveSkills = currentUser.skills_have?.map(s => s.skill_name.toLowerCase()) || [];
        const currentUserWantSkills = currentUser.skills_want?.map(s => s.skill_name.toLowerCase()) || [];
        const targetUserHaveSkills = targetUserWithSkills.skills_have?.map(s => s.skill_name.toLowerCase()) || [];
        const targetUserWantSkills = targetUserWithSkills.skills_want?.map(s => s.skill_name.toLowerCase()) || [];

        const skillsYouCanTeachThem = currentUser.skills_have?.filter(skill => 
            targetUserWantSkills.includes(skill.skill_name.toLowerCase())
        ).map(s => ({
            name: s.skill_name,
            proficiency: s.proficiency_level
        })) || [];

        const skillsTheyCanTeachYou = targetUserWithSkills.skills_have?.filter(skill => 
            currentUserWantSkills.includes(skill.skill_name.toLowerCase())
        ).map(s => ({
            name: s.skill_name,
            proficiency: s.proficiency_level
        })) || [];

        const matchedSkills = {
            skillsYouCanTeachThem,
            skillsTheyCanTeachYou,
            matchScore: skillsYouCanTeachThem.length + skillsTheyCanTeachYou.length,
            note: note || null,
            createdAt: new Date().toISOString()
        };

        // Save the match
        await Match.create(user1Id, targetUserId, matchedSkills);

        res.json({
            success: true,
            message: 'Match saved successfully',
            data: {
                matchedWith: {
                    id: targetUser.id,
                    name: targetUser.name,
                    profile_pic: targetUser.profile_pic
                },
                matchDetails: matchedSkills
            }
        });

    } catch (error) {
        console.error('Save match error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save match',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get saved matches for current user
 * GET /api/matches/saved
 */
const getSavedMatches = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, limit = 20, offset = 0 } = req.query;

        // Validate parameters
        const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
        const offsetNum = Math.max(parseInt(offset) || 0, 0);

        let sql = `
            SELECT m.*, 
                   u1.name as user1_name, u1.profile_pic as user1_pic,
                   u2.name as user2_name, u2.profile_pic as user2_pic
            FROM matches m
            JOIN users u1 ON m.user1_id = u1.id
            JOIN users u2 ON m.user2_id = u2.id
            WHERE m.user1_id = ? OR m.user2_id = ?
        `;

        const params = [userId, userId];

        // Add status filter if specified
        if (status && ['pending', 'accepted', 'declined', 'expired'].includes(status)) {
            sql += ' AND m.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY m.updated_at DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offsetNum);

        const savedMatches = await query(sql, params);

        // Process matches to show the other user's information
        const processedMatches = savedMatches.map(match => {
            const isCurrentUserInitiator = match.user1_id === userId;
            const otherUser = {
                id: isCurrentUserInitiator ? match.user2_id : match.user1_id,
                name: isCurrentUserInitiator ? match.user2_name : match.user1_name,
                profile_pic: isCurrentUserInitiator ? match.user2_pic : match.user1_pic
            };

            return {
                id: match.id,
                otherUser,
                matchDetails: JSON.parse(match.matched_skills),
                status: match.status,
                isInitiator: isCurrentUserInitiator,
                created_at: match.created_at,
                updated_at: match.updated_at
            };
        });

        // Get total count
        let countSql = `
            SELECT COUNT(*) as total FROM matches m 
            WHERE m.user1_id = ? OR m.user2_id = ?
        `;
        const countParams = [userId, userId];

        if (status && ['pending', 'accepted', 'declined', 'expired'].includes(status)) {
            countSql += ' AND m.status = ?';
            countParams.push(status);
        }

        const [{ total }] = await query(countSql, countParams);

        res.json({
            success: true,
            data: {
                matches: processedMatches,
                pagination: {
                    total: parseInt(total),
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: offsetNum + limitNum < total
                }
            }
        });

    } catch (error) {
        console.error('Get saved matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch saved matches',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update match status
 * PUT /api/matches/:matchId/status
 */
const updateMatchStatus = async (req, res) => {
    try {
        const matchId = parseInt(req.params.matchId);
        const { status } = req.body;
        const userId = req.user.id;

        if (isNaN(matchId) || matchId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid match ID'
            });
        }

        const validStatuses = ['accepted', 'declined', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Get match and verify user is part of it
        const matches = await query(
            'SELECT * FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [matchId, userId, userId]
        );

        if (matches.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Match not found or access denied'
            });
        }

        const match = matches[0];

        // Update match status
        await query(
            'UPDATE matches SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, matchId]
        );

        res.json({
            success: true,
            message: `Match ${status} successfully`,
            data: {
                matchId,
                newStatus: status,
                updatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Update match status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update match status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get matching statistics for current user
 * GET /api/matches/statistics
 */
const getMatchingStatistics = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all potential matches
        const allMatches = await Match.findMatches(userId);
        
        // Get saved matches count by status
        const savedMatchesStats = await query(`
            SELECT status, COUNT(*) as count
            FROM matches 
            WHERE user1_id = ? OR user2_id = ?
            GROUP BY status
        `, [userId, userId]);

        // Get user's skills for analysis
        const userWithSkills = await User.getWithSkills(userId);
        
        // Calculate statistics
        const stats = {
            totalPotentialMatches: allMatches.length,
            savedMatches: savedMatchesStats.reduce((acc, item) => {
                acc[item.status] = item.count;
                acc.total = (acc.total || 0) + item.count;
                return acc;
            }, {}),
            skillsYouCanTeach: new Set(),
            skillsYouCanLearn: new Set(),
            averageMatchScore: 0,
            topMatchingSkills: {},
            matchQualityDistribution: {
                excellent: 0,    // 5+ overlapping skills
                good: 0,         // 3-4 overlapping skills
                average: 0,      // 2 overlapping skills
                basic: 0         // 1 overlapping skill
            }
        };

        let totalMatchScore = 0;

        allMatches.forEach(match => {
            const skillsIHave = match.matching_skills_i_have ? 
                match.matching_skills_i_have.split(',') : [];
            const skillsIWant = match.matching_skills_i_want ? 
                match.matching_skills_i_want.split(',') : [];

            // Track unique skills
            skillsIHave.forEach(skill => stats.skillsYouCanTeach.add(skill.trim()));
            skillsIWant.forEach(skill => stats.skillsYouCanLearn.add(skill.trim()));

            // Track skill popularity for teaching
            skillsIHave.forEach(skill => {
                const trimmedSkill = skill.trim();
                stats.topMatchingSkills[trimmedSkill] = (stats.topMatchingSkills[trimmedSkill] || 0) + 1;
            });

            const matchScore = skillsIHave.length + skillsIWant.length;
            totalMatchScore += matchScore;

            // Categorize match quality
            if (matchScore >= 5) stats.matchQualityDistribution.excellent++;
            else if (matchScore >= 3) stats.matchQualityDistribution.good++;
            else if (matchScore >= 2) stats.matchQualityDistribution.average++;
            else stats.matchQualityDistribution.basic++;
        });

        // Convert sets to arrays and calculate averages
        stats.skillsYouCanTeach = Array.from(stats.skillsYouCanTeach);
        stats.skillsYouCanLearn = Array.from(stats.skillsYouCanLearn);
        stats.averageMatchScore = allMatches.length > 0 ? 
            (totalMatchScore / allMatches.length).toFixed(2) : 0;

        // Sort top matching skills
        const sortedSkills = Object.entries(stats.topMatchingSkills)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([skill, count]) => ({ skill, demandCount: count }));
        
        stats.topMatchingSkills = sortedSkills;

        // Add profile completion recommendation
        stats.profileRecommendations = generateProfileRecommendations(userWithSkills, allMatches.length);

        res.json({
            success: true,
            data: { statistics: stats }
        });

    } catch (error) {
        console.error('Get match statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get match statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Calculate compatibility score between two users
 * @param {number} skillsYouTeach - Number of skills you can teach them
 * @param {number} skillsTheyTeach - Number of skills they can teach you
 * @returns {number} Compatibility score (0-100)
 */
const calculateCompatibility = (skillsYouTeach, skillsTheyTeach) => {
    if (skillsYouTeach === 0 || skillsTheyTeach === 0) return 0;
    
    const total = skillsYouTeach + skillsTheyTeach;
    const balance = 1 - (Math.abs(skillsYouTeach - skillsTheyTeach) / Math.max(skillsYouTeach, skillsTheyTeach));
    
    // Score based on total skills and balance
    const baseScore = Math.min(total * 15, 70); // Max 70 points for total skills
    const balanceScore = balance * 30; // Max 30 points for balance
    
    return Math.round(baseScore + balanceScore);
};

/**
 * Calculate skill level compatibility
 * @param {Array} skillsYouTeach - Skills you can teach
 * @param {Array} skillsTheyTeach - Skills they can teach
 * @returns {Object} Skill level compatibility analysis
 */
const calculateSkillLevelCompatibility = (skillsYouTeach, skillsTheyTeach) => {
    const levelValues = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    
    let yourAverageLevel = 0;
    let theirAverageLevel = 0;
    
    if (skillsYouTeach.length > 0) {
        yourAverageLevel = skillsYouTeach.reduce((sum, skill) => 
            sum + (levelValues[skill.proficiency_level] || 2), 0) / skillsYouTeach.length;
    }
    
    if (skillsTheyTeach.length > 0) {
        theirAverageLevel = skillsTheyTeach.reduce((sum, skill) => 
            sum + (levelValues[skill.proficiency_level] || 2), 0) / skillsTheyTeach.length;
    }
    
    return {
        yourAverageLevel: Number(yourAverageLevel.toFixed(1)),
        theirAverageLevel: Number(theirAverageLevel.toFixed(1)),
        levelBalance: Math.abs(yourAverageLevel - theirAverageLevel) <= 1 ? 'good' : 'unbalanced'
    };
};

/**
 * Generate match recommendations
 * @param {Array} skillsYouTeach - Skills you can teach them
 * @param {Array} skillsTheyTeach - Skills they can teach you
 * @param {Object} currentUser - Current user data
 * @param {Object} targetUser - Target user data
 * @returns {Array} Array of recommendations
 */
const generateMatchRecommendations = (skillsYouTeach, skillsTheyTeach, currentUser, targetUser) => {
    const recommendations = [];
    
    if (skillsYouTeach.length === 0) {
        recommendations.push({
            type: 'warning',
            message: 'You have no skills that this user wants to learn'
        });
    }
    
    if (skillsTheyTeach.length === 0) {
        recommendations.push({
            type: 'warning', 
            message: 'This user has no skills that you want to learn'
        });
    }
    
    if (skillsYouTeach.length > 0 && skillsTheyTeach.length > 0) {
        recommendations.push({
            type: 'success',
            message: 'Great mutual match! You can both teach and learn from each other'
        });
    }
    
    if (currentUser.location && targetUser.location && 
        currentUser.location.toLowerCase() === targetUser.location.toLowerCase()) {
        recommendations.push({
            type: 'info',
            message: 'You\'re both in the same location - perfect for in-person sessions!'
        });
    }
    
    return recommendations;
};

/**
 * Generate profile recommendations based on matching data
 * @param {Object} user - User with skills data
 * @param {number} matchCount - Number of potential matches
 * @returns {Array} Array of profile improvement recommendations
 */
const generateProfileRecommendations = (user, matchCount) => {
    const recommendations = [];
    
    if (!user.bio || user.bio.trim().length < 50) {
        recommendations.push({
            type: 'improvement',
            message: 'Add a detailed bio to attract more matches',
            impact: 'medium'
        });
    }
    
    if (!user.location) {
        recommendations.push({
            type: 'improvement',
            message: 'Add your location to find nearby skill partners',
            impact: 'high'
        });
    }
    
    if (!user.skills_have || user.skills_have.length < 3) {
        recommendations.push({
            type: 'improvement',
            message: 'Add more skills you can teach to increase match opportunities',
            impact: 'high'
        });
    }
    
    if (!user.skills_want || user.skills_want.length < 3) {
        recommendations.push({
            type: 'improvement', 
            message: 'Add more skills you want to learn to find better matches',
            impact: 'medium'
        });
    }
    
    if (matchCount === 0) {
        recommendations.push({
            type: 'suggestion',
            message: 'Try adding more popular skills or adjusting your skill preferences',
            impact: 'high'
        });
    }
    
    return recommendations;
};

module.exports = {
    getMatches,
    getDetailedMatch,
    saveMatch,
    getSavedMatches,
    updateMatchStatus,
    getMatchingStatistics
};
                        