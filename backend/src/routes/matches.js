
// Skill matching system routes

const express = require('express');
const { Match, User, Notification, query } = require('../models/database');
const emailService = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/matches
// @desc    Get recommended matches for current user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10, offset = 0 } = req.query;

        // Find reciprocal matches
        const matches = await Match.findMatches(userId);

        // Process matches to include match score and details
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
                    profile_pic: match.profile_pic
                },
                matchDetails: {
                    skillsYouCanTeachThem: skillsIHave,
                    skillsTheyCanTeachYou: skillsIWant,
                    matchScore: skillsIHave.length + skillsIWant.length,
                    mutualSkillsCount: Math.min(skillsIHave.length, skillsIWant.length)
                }
            };
        });

        // Sort by match score (highest first)
        processedMatches.sort((a, b) => b.matchDetails.matchScore - a.matchDetails.matchScore);

        // Apply pagination
        const paginatedMatches = processedMatches.slice(
            parseInt(offset), 
            parseInt(offset) + parseInt(limit)
        );

        res.json({
            success: true,
            data: {
                matches: paginatedMatches,
                pagination: {
                    total: processedMatches.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < processedMatches.length
                }
            }
        });
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch matches'
        });
    }
});

// @route   GET /api/matches/detailed/:userId
// @desc    Get detailed match information between current user and specific user
// @access  Private
router.get('/detailed/:userId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = parseInt(req.params.userId);

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
        const currentUserHaveSkills = currentUser.skills_have.map(s => s.skill_name.toLowerCase());
        const currentUserWantSkills = currentUser.skills_want.map(s => s.skill_name.toLowerCase());
        const targetUserHaveSkills = targetUser.skills_have.map(s => s.skill_name.toLowerCase());
        const targetUserWantSkills = targetUser.skills_want.map(s => s.skill_name.toLowerCase());

        // Find overlapping skills
        const skillsYouCanTeachThem = currentUser.skills_have.filter(skill => 
            targetUserWantSkills.includes(skill.skill_name.toLowerCase())
        );

        const skillsTheyCanTeachYou = targetUser.skills_have.filter(skill => 
            currentUserWantSkills.includes(skill.skill_name.toLowerCase())
        );

        // Calculate match score
        const matchScore = skillsYouCanTeachThem.length + skillsTheyCanTeachYou.length;
        const isValidMatch = skillsYouCanTeachThem.length > 0 && skillsTheyCanTeachYou.length > 0;

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
                    skills_want: targetUser.skills_want
                },
                matchAnalysis: {
                    isValidMatch,
                    matchScore,
                    skillsYouCanTeachThem,
                    skillsTheyCanTeachYou,
                    mutualBenefit: {
                        yourSkillsTheyWant: skillsYouCanTeachThem.length,
                        theirSkillsYouWant: skillsTheyCanTeachYou.length
                    }
                }
            }
        });
    } catch (error) {
        console.error('Get detailed match error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get match details'
        });
    }
});

// @route   POST /api/matches/save
// @desc    Save a potential match for future reference
// @access  Private
router.post('/save', authenticateToken, async (req, res) => {
    try {
        const user1Id = req.user.id;
        const { user2Id } = req.body;

        if (!user2Id) {
            return res.status(400).json({
                success: false,
                message: 'Target user ID is required'
            });
        }

        if (user1Id === parseInt(user2Id)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot match with yourself'
            });
        }

        // Verify target user exists
        const targetUser = await User.findById(user2Id);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Target user not found'
            });
        }

        // Calculate matched skills
        const currentUser = await User.getWithSkills(user1Id);
        const targetUserWithSkills = await User.getWithSkills(user2Id);

        const currentUserHaveSkills = currentUser.skills_have.map(s => s.skill_name.toLowerCase());
        const currentUserWantSkills = currentUser.skills_want.map(s => s.skill_name.toLowerCase());
        const targetUserHaveSkills = targetUserWithSkills.skills_have.map(s => s.skill_name.toLowerCase());
        const targetUserWantSkills = targetUserWithSkills.skills_want.map(s => s.skill_name.toLowerCase());

        const skillsYouCanTeachThem = currentUser.skills_have.filter(skill => 
            targetUserWantSkills.includes(skill.skill_name.toLowerCase())
        );

        const skillsTheyCanTeachYou = targetUserWithSkills.skills_have.filter(skill => 
            currentUserWantSkills.includes(skill.skill_name.toLowerCase())
        );

        const matchedSkills = {
            skillsYouCanTeachThem: skillsYouCanTeachThem.map(s => s.skill_name),
            skillsTheyCanTeachYou: skillsTheyCanTeachYou.map(s => s.skill_name),
            matchScore: skillsYouCanTeachThem.length + skillsTheyCanTeachYou.length
        };

        // Save the match
        await Match.create(user1Id, user2Id, matchedSkills);

        // Create a notification for the target user about the request
        try {
            await Notification.create({
                user_id: targetUser.id,
                from_user_id: user1Id,
                type: 'connection_request',
                title: 'New Connection Request',
                message: `${currentUser.name} wants to connect for skill swapping!`,
                data: {
                    fromUser: { id: currentUser.id, name: currentUser.name, profile_pic: currentUser.profile_pic },
                    matchData: matchedSkills
                }
            });
        } catch (e) {
            console.error('Failed to create request notification', e);
        }

        res.json({
            success: true,
            message: 'Match saved successfully',
            data: {
                matchedWith: {
                    id: targetUser.id,
                    name: targetUser.name
                },
                matchDetails: matchedSkills
            }
        });
    } catch (error) {
        console.error('Save match error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save match'
        });
    }
});

// @route   POST /api/matches/accept
// @desc    Accept a pending connection request
// @access  Private
router.post('/accept', authenticateToken, async (req, res) => {
    try {
        console.log('POST /api/matches/accept called');
        const currentUserId = req.user.id;
        const { userId } = req.body; // other user id
        const otherUserId = parseInt(userId);
        if (!otherUserId || otherUserId === currentUserId) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const ok = await Match.accept(currentUserId, otherUserId);
        if (!ok) {
            return res.status(404).json({ success: false, message: 'No pending request found' });
        }

        // Notify the requester
        const [currentUser] = await Promise.all([
            User.findById(currentUserId)
        ]);
        try {
            await Notification.create({
                user_id: otherUserId,
                from_user_id: currentUserId,
                type: 'connection_accepted',
                title: 'Connection Accepted',
                message: `${currentUser.name} accepted your connection request.`,
                data: { fromUser: { id: currentUser.id, name: currentUser.name, profile_pic: currentUser.profile_pic } }
            });
        } catch (e) {
            console.error('Failed to create accepted notification', e);
        }

        // Send acceptance emails to both parties
        try {
            const [requester, accepter] = await Promise.all([
                User.findById(otherUserId), // requester (who sent the request)
                User.findById(currentUserId) // accepter (current user)
            ]);

            // Fetch matched skills between the two users for email templates
            const matches = await query(
                'SELECT matched_skills FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?) ORDER BY updated_at DESC LIMIT 1',
                [currentUserId, otherUserId, otherUserId, currentUserId]
            );

            let matchDetails = {};
            if (matches && matches.length > 0) {
                try {
                    matchDetails = JSON.parse(matches[0].matched_skills);
                } catch (_) {
                    matchDetails = {};
                }
            }

            await Promise.all([
                emailService.sendConnectionAcceptedToRequester(requester, accepter, matchDetails),
                emailService.sendConnectionAcceptedToAccepter(accepter, requester, matchDetails)
            ]);
            console.log('Acceptance emails dispatched');
        } catch (emailErr) {
            console.error('Error dispatching acceptance emails:', emailErr);
        }

        res.json({ success: true, message: 'Connection request accepted' });
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({ success: false, message: 'Failed to accept request' });
    }
});

// @route   POST /api/matches/decline
// @desc    Decline a pending connection request
// @access  Private
router.post('/decline', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.body; // other user id
        const otherUserId = parseInt(userId);
        if (!otherUserId || otherUserId === currentUserId) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const ok = await Match.decline(currentUserId, otherUserId);
        if (!ok) {
            return res.status(404).json({ success: false, message: 'No pending request found' });
        }

        // Notify the requester
        const [currentUser] = await Promise.all([
            User.findById(currentUserId)
        ]);
        try {
            await Notification.create({
                user_id: otherUserId,
                from_user_id: currentUserId,
                type: 'connection_declined',
                title: 'Connection Declined',
                message: `${currentUser.name} declined your connection request.`,
                data: { fromUser: { id: currentUser.id, name: currentUser.name, profile_pic: currentUser.profile_pic } }
            });
        } catch (e) {
            console.error('Failed to create declined notification', e);
        }

        res.json({ success: true, message: 'Connection request declined' });
    } catch (error) {
        console.error('Decline request error:', error);
        res.status(500).json({ success: false, message: 'Failed to decline request' });
    }
});

// @route   GET /api/matches/statistics
// @desc    Get matching statistics for current user
// @access  Private
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all potential matches
        const allMatches = await Match.findMatches(userId);
        
        // Calculate statistics
        const stats = {
            totalPotentialMatches: allMatches.length,
            skillsYouCanTeach: new Set(),
            skillsYouCanLearn: new Set(),
            averageMatchScore: 0,
            topMatchingSkills: {}
        };

        let totalMatchScore = 0;

        allMatches.forEach(match => {
            const skillsIHave = match.matching_skills_i_have ? 
                match.matching_skills_i_have.split(',') : [];
            const skillsIWant = match.matching_skills_i_want ? 
                match.matching_skills_i_want.split(',') : [];

            // Track unique skills
            skillsIHave.forEach(skill => stats.skillsYouCanTeach.add(skill));
            skillsIWant.forEach(skill => stats.skillsYouCanLearn.add(skill));

            // Track skill popularity for teaching
            skillsIHave.forEach(skill => {
                stats.topMatchingSkills[skill] = (stats.topMatchingSkills[skill] || 0) + 1;
            });

            totalMatchScore += skillsIHave.length + skillsIWant.length;
        });

        // Convert sets to arrays and calculate averages
        stats.skillsYouCanTeach = Array.from(stats.skillsYouCanTeach);
        stats.skillsYouCanLearn = Array.from(stats.skillsYouCanLearn);
        stats.averageMatchScore = allMatches.length > 0 ? 
            (totalMatchScore / allMatches.length).toFixed(2) : 0;

        // Sort top matching skills
        const sortedSkills = Object.entries(stats.topMatchingSkills)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([skill, count]) => ({ skill, demandCount: count }));
        
        stats.topMatchingSkills = sortedSkills;

        res.json({
            success: true,
            data: { statistics: stats }
        });
    } catch (error) {
        console.error('Get match statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get match statistics'
        });
    }
});

// @route   GET /api/matches/saved
// @desc    Get saved matches for current user
// @access  Private
router.get('/saved', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Getting saved matches for user ID:', userId);
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
            WHERE (m.user1_id = ? OR m.user2_id = ?)
        `;

        const params = [userId, userId];

        // Add status filter if specified
        if (status && ['pending', 'accepted', 'declined', 'expired'].includes(status)) {
            sql += ' AND m.status = ?';
            params.push(status);
        }

        // Some MySQL setups don't allow placeholders for LIMIT/OFFSET; inline safe integers
        sql += ` ORDER BY m.updated_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

        const savedMatches = await query(sql, params);
        console.log('Found saved matches:', savedMatches.length);

        // Process matches to show the other user's information
        const processedMatches = savedMatches.map(match => {
            const isCurrentUserInitiator = match.user1_id === userId;
            const otherUser = {
                id: isCurrentUserInitiator ? match.user2_id : match.user1_id,
                name: isCurrentUserInitiator ? match.user2_name : match.user1_name,
                profile_pic: isCurrentUserInitiator ? match.user2_pic : match.user1_pic
            };

            // Safely parse matched_skills JSON
            let matchDetails = {};
            try {
                matchDetails = match.matched_skills ? JSON.parse(match.matched_skills) : {};
            } catch (parseError) {
                console.error('Error parsing matched_skills for match', match.id, ':', parseError);
                matchDetails = {};
            }

            return {
                id: match.id,
                otherUser,
                matchDetails,
                status: match.status,
                isInitiator: isCurrentUserInitiator,
                created_at: match.created_at,
                updated_at: match.updated_at
            };
        });

        // Get total count
        let countSql = `
            SELECT COUNT(*) as total FROM matches m 
            WHERE (m.user1_id = ? OR m.user2_id = ?)
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
});

module.exports = router;