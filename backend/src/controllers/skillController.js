// src/controllers/skillController.js
// Skills management controller for handling skill operations

const { Skill, User, query } = require('../models/database');

/**
 * Get all available skills
 * GET /api/skills
 */
const getAllSkills = async (req, res) => {
    try {
        const { search, limit = 100, popular = false } = req.query;

        let sql = 'SELECT * FROM skills';
        let params = [];

        // Add search filter if provided
        if (search && search.trim()) {
            sql += ' WHERE skill_name LIKE ?';
            params.push(`%${search.trim()}%`);
        }

        // Add popular skills ordering if requested
        if (popular === 'true') {
            // Get skills ordered by usage count
            sql = `
                SELECT s.*, 
                       (SELECT COUNT(*) FROM user_skills_have ush WHERE ush.skill_id = s.id) +
                       (SELECT COUNT(*) FROM user_skills_want usw WHERE usw.skill_id = s.id) as usage_count
                FROM skills s
            `;
            
            if (search && search.trim()) {
                sql += ' WHERE s.skill_name LIKE ?';
            }
            
            sql += ' ORDER BY usage_count DESC, s.skill_name ASC';
        } else {
            sql += ' ORDER BY skill_name ASC';
        }

        // Add limit
        sql += ' LIMIT ?';
        params.push(Math.min(parseInt(limit) || 100, 500));

        const skills = await query(sql, params);

        res.json({
            success: true,
            data: { 
                skills,
                meta: {
                    total: skills.length,
                    searchTerm: search || null,
                    popular: popular === 'true'
                }
            }
        });

    } catch (error) {
        console.error('Get all skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch skills',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Add skills to user's "have" list
 * POST /api/skills/add-to-have
 */
const addSkillsToHave = async (req, res) => {
    try {
        const { skills } = req.body;
        const userId = req.user.id;

        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Skills array is required and must not be empty'
            });
        }

        if (skills.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add more than 20 skills at once'
            });
        }

        const addedSkills = [];
        const errors = [];

        // Process each skill
        for (let i = 0; i < skills.length; i++) {
            const skillData = skills[i];
            
            try {
                // Validate skill data
                if (!skillData.name || typeof skillData.name !== 'string') {
                    errors.push(`Skill ${i + 1}: Name is required and must be a string`);
                    continue;
                }

                const skillName = skillData.name.trim();
                if (skillName.length < 1 || skillName.length > 100) {
                    errors.push(`Skill ${i + 1}: Name must be between 1 and 100 characters`);
                    continue;
                }

                // Validate proficiency level
                const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
                const proficiencyLevel = skillData.level || 'intermediate';
                if (!validLevels.includes(proficiencyLevel)) {
                    errors.push(`Skill ${i + 1}: Invalid proficiency level. Must be one of: ${validLevels.join(', ')}`);
                    continue;
                }

                // Find or create skill
                const skill = await Skill.findOrCreate(skillName);
                
                // Add to user's have list
                await Skill.addToUserHave(userId, skill.id, proficiencyLevel);

                addedSkills.push({
                    id: skill.id,
                    skill_name: skill.skill_name,
                    proficiency_level: proficiencyLevel
                });

            } catch (skillError) {
                console.error('Error processing skill:', skillData, skillError);
                errors.push(`Skill ${i + 1}: ${skillError.message}`);
            }
        }

        // Get updated user skills
        const updatedUser = await User.getWithSkills(userId);

        const response = {
            success: addedSkills.length > 0,
            message: addedSkills.length > 0 
                ? `Successfully added ${addedSkills.length} skill(s) to your expertise`
                : 'No skills were added',
            data: {
                addedSkills,
                allSkillsHave: updatedUser.skills_have
            }
        };

        if (errors.length > 0) {
            response.warnings = errors;
        }

        res.status(addedSkills.length > 0 ? 200 : 400).json(response);

    } catch (error) {
        console.error('Add skills to have error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add skills',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Add skills to user's "want" list
 * POST /api/skills/add-to-want
 */
const addSkillsToWant = async (req, res) => {
    try {
        const { skills } = req.body;
        const userId = req.user.id;

        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Skills array is required and must not be empty'
            });
        }

        if (skills.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add more than 20 skills at once'
            });
        }

        const addedSkills = [];
        const errors = [];

        // Process each skill
        for (let i = 0; i < skills.length; i++) {
            const skillData = skills[i];
            
            try {
                // Validate skill data
                if (!skillData.name || typeof skillData.name !== 'string') {
                    errors.push(`Skill ${i + 1}: Name is required and must be a string`);
                    continue;
                }

                const skillName = skillData.name.trim();
                if (skillName.length < 1 || skillName.length > 100) {
                    errors.push(`Skill ${i + 1}: Name must be between 1 and 100 characters`);
                    continue;
                }

                // Validate urgency level
                const validLevels = ['low', 'medium', 'high'];
                const urgencyLevel = skillData.urgency || 'medium';
                if (!validLevels.includes(urgencyLevel)) {
                    errors.push(`Skill ${i + 1}: Invalid urgency level. Must be one of: ${validLevels.join(', ')}`);
                    continue;
                }

                // Find or create skill
                const skill = await Skill.findOrCreate(skillName);
                
                // Add to user's want list
                await Skill.addToUserWant(userId, skill.id, urgencyLevel);

                addedSkills.push({
                    id: skill.id,
                    skill_name: skill.skill_name,
                    urgency_level: urgencyLevel
                });

            } catch (skillError) {
                console.error('Error processing skill:', skillData, skillError);
                errors.push(`Skill ${i + 1}: ${skillError.message}`);
            }
        }

        // Get updated user skills
        const updatedUser = await User.getWithSkills(userId);

        const response = {
            success: addedSkills.length > 0,
            message: addedSkills.length > 0 
                ? `Successfully added ${addedSkills.length} skill(s) to your learning goals`
                : 'No skills were added',
            data: {
                addedSkills,
                allSkillsWant: updatedUser.skills_want
            }
        };

        if (errors.length > 0) {
            response.warnings = errors;
        }

        res.status(addedSkills.length > 0 ? 200 : 400).json(response);

    } catch (error) {
        console.error('Add skills to want error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add skills',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Remove skill from user's "have" list
 * DELETE /api/skills/remove-from-have/:skillId
 */
const removeSkillFromHave = async (req, res) => {
    try {
        const skillId = parseInt(req.params.skillId);
        const userId = req.user.id;

        if (isNaN(skillId) || skillId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid skill ID'
            });
        }

        // Verify skill exists in user's "have" list
        const userSkills = await query(
            'SELECT * FROM user_skills_have WHERE user_id = ? AND skill_id = ?',
            [userId, skillId]
        );

        if (userSkills.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in your expertise list'
            });
        }

        // Remove skill
        await Skill.removeFromUserHave(userId, skillId);

        // Get updated skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: 'Skill removed from your expertise',
            data: {
                removedSkillId: skillId,
                allSkillsHave: updatedUser.skills_have
            }
        });

    } catch (error) {
        console.error('Remove skill from have error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove skill',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Remove skill from user's "want" list
 * DELETE /api/skills/remove-from-want/:skillId
 */
const removeSkillFromWant = async (req, res) => {
    try {
        const skillId = parseInt(req.params.skillId);
        const userId = req.user.id;

        if (isNaN(skillId) || skillId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid skill ID'
            });
        }

        // Verify skill exists in user's "want" list
        const userSkills = await query(
            'SELECT * FROM user_skills_want WHERE user_id = ? AND skill_id = ?',
            [userId, skillId]
        );

        if (userSkills.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in your learning goals'
            });
        }

        // Remove skill
        await Skill.removeFromUserWant(userId, skillId);

        // Get updated skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: 'Skill removed from your learning goals',
            data: {
                removedSkillId: skillId,
                allSkillsWant: updatedUser.skills_want
            }
        });

    } catch (error) {
        console.error('Remove skill from want error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove skill',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update proficiency level for a skill user has
 * PUT /api/skills/update-proficiency
 */
const updateProficiency = async (req, res) => {
    try {
        const { skillId, proficiencyLevel } = req.body;
        const userId = req.user.id;

        // Validate inputs
        if (!skillId || !proficiencyLevel) {
            return res.status(400).json({
                success: false,
                message: 'Skill ID and proficiency level are required'
            });
        }

        const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
        if (!validLevels.includes(proficiencyLevel)) {
            return res.status(400).json({
                success: false,
                message: `Invalid proficiency level. Must be one of: ${validLevels.join(', ')}`
            });
        }

        // Verify skill exists in user's "have" list
        const userSkills = await query(
            'SELECT * FROM user_skills_have WHERE user_id = ? AND skill_id = ?',
            [userId, skillId]
        );

        if (userSkills.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in your expertise list'
            });
        }

        // Update proficiency
        await Skill.addToUserHave(userId, skillId, proficiencyLevel);

        // Get updated skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: 'Proficiency level updated successfully',
            data: {
                skillId: parseInt(skillId),
                newProficiencyLevel: proficiencyLevel,
                allSkillsHave: updatedUser.skills_have
            }
        });

    } catch (error) {
        console.error('Update proficiency error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update proficiency level',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update urgency level for a skill user wants
 * PUT /api/skills/update-urgency
 */
const updateUrgency = async (req, res) => {
    try {
        const { skillId, urgencyLevel } = req.body;
        const userId = req.user.id;

        // Validate inputs
        if (!skillId || !urgencyLevel) {
            return res.status(400).json({
                success: false,
                message: 'Skill ID and urgency level are required'
            });
        }

        const validLevels = ['low', 'medium', 'high'];
        if (!validLevels.includes(urgencyLevel)) {
            return res.status(400).json({
                success: false,
                message: `Invalid urgency level. Must be one of: ${validLevels.join(', ')}`
            });
        }

        // Verify skill exists in user's "want" list
        const userSkills = await query(
            'SELECT * FROM user_skills_want WHERE user_id = ? AND skill_id = ?',
            [userId, skillId]
        );

        if (userSkills.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in your learning goals'
            });
        }

        // Update urgency
        await Skill.addToUserWant(userId, skillId, urgencyLevel);

        // Get updated skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: 'Urgency level updated successfully',
            data: {
                skillId: parseInt(skillId),
                newUrgencyLevel: urgencyLevel,
                allSkillsWant: updatedUser.skills_want
            }
        });

    } catch (error) {
        console.error('Update urgency error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update urgency level',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get skill suggestions based on user's current skills
 * GET /api/skills/suggestions
 */
const getSkillSuggestions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type = 'want', limit = 10 } = req.query;

        if (!['have', 'want'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be either "have" or "want"'
            });
        }

        // Get user's current skills
        const userWithSkills = await User.getWithSkills(userId);
        
        const userSkillNames = type === 'have' 
            ? userWithSkills.skills_have?.map(s => s.skill_name.toLowerCase()) || []
            : userWithSkills.skills_want?.map(s => s.skill_name.toLowerCase()) || [];

        // Get popular skills that user doesn't already have/want
        const sql = `
            SELECT s.*, 
                   (SELECT COUNT(*) FROM user_skills_have ush WHERE ush.skill_id = s.id) +
                   (SELECT COUNT(*) FROM user_skills_want usw WHERE usw.skill_id = s.id) as usage_count
            FROM skills s
            WHERE LOWER(s.skill_name) NOT IN (${userSkillNames.map(() => '?').join(',') || 'NULL'})
            ORDER BY usage_count DESC, s.skill_name ASC
            LIMIT ?
        `;

        const params = [...userSkillNames, Math.min(parseInt(limit) || 10, 50)];
        const suggestions = await query(sql, params);

        res.json({
            success: true,
            data: {
                suggestions,
                type,
                excludedCount: userSkillNames.length
            }
        });

    } catch (error) {
        console.error('Get skill suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get skill suggestions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get skill statistics
 * GET /api/skills/:skillId/stats
 */
const getSkillStats = async (req, res) => {
    try {
        const skillId = parseInt(req.params.skillId);

        if (isNaN(skillId) || skillId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid skill ID'
            });
        }

        // Get skill info
        const skills = await query('SELECT * FROM skills WHERE id = ?', [skillId]);
        if (skills.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found'
            });
        }

        const skill = skills[0];

        // Get statistics
        const [haveCount] = await query(
            'SELECT COUNT(*) as count FROM user_skills_have WHERE skill_id = ?',
            [skillId]
        );

        const [wantCount] = await query(
            'SELECT COUNT(*) as count FROM user_skills_want WHERE skill_id = ?',
            [skillId]
        );

        // Get proficiency distribution
        const proficiencyDistribution = await query(`
            SELECT proficiency_level, COUNT(*) as count 
            FROM user_skills_have 
            WHERE skill_id = ? 
            GROUP BY proficiency_level
        `, [skillId]);

        // Get urgency distribution
        const urgencyDistribution = await query(`
            SELECT urgency_level, COUNT(*) as count 
            FROM user_skills_want 
            WHERE skill_id = ? 
            GROUP BY urgency_level
        `, [skillId]);

        const stats = {
            skill: {
                id: skill.id,
                name: skill.skill_name
            },
            usage: {
                totalUsers: haveCount.count + wantCount.count,
                canTeach: haveCount.count,
                wantToLearn: wantCount.count
            },
            proficiencyDistribution: proficiencyDistribution.reduce((acc, item) => {
                acc[item.proficiency_level] = item.count;
                return acc;
            }, {}),
            urgencyDistribution: urgencyDistribution.reduce((acc, item) => {
                acc[item.urgency_level] = item.count;
                return acc;
            }, {})
        };

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        console.error('Get skill stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get skill statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getAllSkills,
    addSkillsToHave,
    addSkillsToWant,
    removeSkillFromHave,
    removeSkillFromWant,
    updateProficiency,
    updateUrgency,
    getSkillSuggestions,
    getSkillStats
};