// Skills management routes

const express = require('express');
const { Skill, User } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { validateSkills } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/skills
// @desc    Get all available skills
// @access  Public
router.get('/', async (req, res) => {
    try {
        const skills = await Skill.getAll();
        
        res.json({
            success: true,
            data: { skills }
        });
    } catch (error) {
        console.error('Get skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch skills'
        });
    }
});

// @route   POST /api/skills/add-to-have
// @desc    Add skills to user's "have" list
// @access  Private
router.post('/add-to-have', authenticateToken, validateSkills, async (req, res) => {
    try {
        const { skills } = req.body;
        const userId = req.user.id;

        const addedSkills = [];

        for (const skillData of skills) {
            // Find or create skill
            const skill = await Skill.findOrCreate(skillData.name);
            
            // Add to user's have list
            await Skill.addToUserHave(
                userId, 
                skill.id, 
                skillData.level || 'intermediate'
            );

            addedSkills.push({
                id: skill.id,
                skill_name: skill.skill_name,
                proficiency_level: skillData.level || 'intermediate'
            });
        }

        // Get updated user with skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: `Added ${addedSkills.length} skill(s) to your expertise`,
            data: {
                addedSkills,
                allSkillsHave: updatedUser.skills_have
            }
        });
    } catch (error) {
        console.error('Add skills to have error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add skills'
        });
    }
});

// @route   POST /api/skills/add-to-want
// @desc    Add skills to user's "want" list
// @access  Private
router.post('/add-to-want', authenticateToken, validateSkills, async (req, res) => {
    try {
        const { skills } = req.body;
        const userId = req.user.id;

        const addedSkills = [];

        for (const skillData of skills) {
            // Find or create skill
            const skill = await Skill.findOrCreate(skillData.name);
            
            // Add to user's want list
            await Skill.addToUserWant(
                userId, 
                skill.id, 
                skillData.urgency || 'medium'
            );

            addedSkills.push({
                id: skill.id,
                skill_name: skill.skill_name,
                urgency_level: skillData.urgency || 'medium'
            });
        }

        // Get updated user with skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: `Added ${addedSkills.length} skill(s) to your learning goals`,
            data: {
                addedSkills,
                allSkillsWant: updatedUser.skills_want
            }
        });
    } catch (error) {
        console.error('Add skills to want error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add skills'
        });
    }
});

// @route   DELETE /api/skills/remove-from-have/:skillId
// @desc    Remove skill from user's "have" list
// @access  Private
router.delete('/remove-from-have/:skillId', authenticateToken, async (req, res) => {
    try {
        const skillId = parseInt(req.params.skillId);
        const userId = req.user.id;

        if (!skillId || skillId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid skill ID'
            });
        }

        await Skill.removeFromUserHave(userId, skillId);

        // Get updated skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: 'Skill removed from your expertise',
            data: {
                allSkillsHave: updatedUser.skills_have
            }
        });
    } catch (error) {
        console.error('Remove skill from have error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove skill'
        });
    }
});

// @route   DELETE /api/skills/remove-from-want/:skillId
// @desc    Remove skill from user's "want" list
// @access  Private
router.delete('/remove-from-want/:skillId', authenticateToken, async (req, res) => {
    try {
        const skillId = parseInt(req.params.skillId);
        const userId = req.user.id;

        if (!skillId || skillId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid skill ID'
            });
        }

        await Skill.removeFromUserWant(userId, skillId);

        // Get updated skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: 'Skill removed from your learning goals',
            data: {
                allSkillsWant: updatedUser.skills_want
            }
        });
    } catch (error) {
        console.error('Remove skill from want error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove skill'
        });
    }
});

// @route   PUT /api/skills/update-proficiency
// @desc    Update proficiency level for a skill user has
// @access  Private
router.put('/update-proficiency', authenticateToken, async (req, res) => {
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
                message: 'Invalid proficiency level'
            });
        }

        // Update proficiency (this will also add the skill if not exists)
        await Skill.addToUserHave(userId, skillId, proficiencyLevel);

        // Get updated skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: 'Proficiency level updated successfully',
            data: {
                allSkillsHave: updatedUser.skills_have
            }
        });
    } catch (error) {
        console.error('Update proficiency error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update proficiency level'
        });
    }
});

// @route   PUT /api/skills/update-urgency
// @desc    Update urgency level for a skill user wants
// @access  Private
router.put('/update-urgency', authenticateToken, async (req, res) => {
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
                message: 'Invalid urgency level'
            });
        }

        // Update urgency (this will also add the skill if not exists)
        await Skill.addToUserWant(userId, skillId, urgencyLevel);

        // Get updated skills
        const updatedUser = await User.getWithSkills(userId);

        res.json({
            success: true,
            message: 'Urgency level updated successfully',
            data: {
                allSkillsWant: updatedUser.skills_want
            }
        });
    } catch (error) {
        console.error('Update urgency error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update urgency level'
        });
    }
});

module.exports = router;