// src/routes/auth.js - COMPLETE AUTH ROUTES
const express = require('express');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const {
    register,
    login,
    verifyToken,
    refreshToken,
    changePassword,
    logout
} = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, register);

// @route   POST /api/auth/login
// @desc    Login user and get token
// @access  Public
router.post('/login', validateLogin, login);

// @route   POST /api/auth/verify
// @desc    Verify JWT token validity
// @access  Public
router.post('/verify', verifyToken);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Public
router.post('/refresh', refreshToken);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, changePassword);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token invalidation)
// @access  Private
router.post('/logout', authenticateToken, logout);

module.exports = router;

// src/routes/users.js - COMPLETE USER ROUTES
const express = require('express');
const { authenticateToken, requireOwnership, optionalAuth } = require('../middleware/auth');
const { validateProfileUpdate, validateId } = require('../middleware/validation');
const {
    getMe,
    getUserProfile,
    updateUserProfile,
    getUserDocuments,
    searchUsers,
    getUserStats,
    deleteUser
} = require('../controllers/userController');

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authenticateToken, getMe);

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID (public view)
// @access  Public (but enhanced if authenticated)
router.get('/profile/:id', validateId, optionalAuth, getUserProfile);

// @route   PUT /api/users/profile/:id
// @desc    Update user profile
// @access  Private (own profile only)
router.put('/profile/:id', validateId, authenticateToken, requireOwnership, validateProfileUpdate, updateUserProfile);

// @route   GET /api/users/:id/documents
// @desc    Get user's documents
// @access  Private (own documents only)
router.get('/:id/documents', validateId, authenticateToken, requireOwnership, getUserDocuments);

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Public (but enhanced for own profile)
router.get('/:id/stats', validateId, optionalAuth, getUserStats);

// @route   GET /api/users/search
// @desc    Search users by skills, location, or name
// @access  Public
router.get('/search', optionalAuth, searchUsers);

// @route   DELETE /api/users/:id
// @desc    Delete user account
// @access  Private (own account only)
router.delete('/:id', validateId, authenticateToken, requireOwnership, deleteUser);

module.exports = router;

// src/routes/skills.js - COMPLETE SKILLS ROUTES
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateSkills } = require('../middleware/validation');
const {
    getAllSkills,
    addSkillsToHave,
    addSkillsToWant,
    removeSkillFromHave,
    removeSkillFromWant,
    updateProficiency,
    updateUrgency,
    getSkillSuggestions,
    getSkillStats
} = require('../controllers/skillController');

const router = express.Router();

// @route   GET /api/skills
// @desc    Get all available skills with optional search
// @access  Public
router.get('/', getAllSkills);

// @route   GET /api/skills/suggestions
// @desc    Get skill suggestions for user
// @access  Private
router.get('/suggestions', authenticateToken, getSkillSuggestions);

// @route   GET /api/skills/:skillId/stats
// @desc    Get statistics for a specific skill
// @access  Public
router.get('/:skillId/stats', getSkillStats);

// @route   POST /api/skills/add-to-have
// @desc    Add skills to user's "have" list
// @access  Private
router.post('/add-to-have', authenticateToken, validateSkills, addSkillsToHave);

// @route   POST /api/skills/add-to-want
// @desc    Add skills to user's "want" list
// @access  Private
router.post('/add-to-want', authenticateToken, validateSkills, addSkillsToWant);

// @route   DELETE /api/skills/remove-from-have/:skillId
// @desc    Remove skill from user's "have" list
// @access  Private
router.delete('/remove-from-have/:skillId', authenticateToken, removeSkillFromHave);

// @route   DELETE /api/skills/remove-from-want/:skillId
// @desc    Remove skill from user's "want" list
// @access  Private
router.delete('/remove-from-want/:skillId', authenticateToken, removeSkillFromWant);

// @route   PUT /api/skills/update-proficiency
// @desc    Update proficiency level for a skill user has
// @access  Private
router.put('/update-proficiency', authenticateToken, updateProficiency);

// @route   PUT /api/skills/update-urgency
// @desc    Update urgency level for a skill user wants
// @access  Private
router.put('/update-urgency', authenticateToken, updateUrgency);

module.exports = router;

// src/routes/matches.js - COMPLETE MATCHING ROUTES
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
    getMatches,
    getDetailedMatch,
    saveMatch,
    getSavedMatches,
    updateMatchStatus,
    getMatchingStatistics,
    deleteMatch,
    getMatchSuggestions
} = require('../controllers/matchController');

const router = express.Router();

// @route   GET /api/matches
// @desc    Get recommended matches for current user
// @access  Private
router.get('/', authenticateToken, getMatches);

// @route   GET /api/matches/saved
// @desc    Get saved matches for current user
// @access  Private
router.get('/saved', authenticateToken, getSavedMatches);

// @route   GET /api/matches/statistics
// @desc    Get matching statistics for current user
// @access  Private
router.get('/statistics', authenticateToken, getMatchingStatistics);

// @route   GET /api/matches/suggestions
// @desc    Get match suggestions based on user activity
// @access  Private
router.get('/suggestions', authenticateToken, getMatchSuggestions);

// @route   GET /api/matches/detailed/:userId
// @desc    Get detailed match information between current user and specific user
// @access  Private
router.get('/detailed/:userId', authenticateToken, getDetailedMatch);

// @route   POST /api/matches/save
// @desc    Save a potential match for future reference
// @access  Private
router.post('/save', authenticateToken, saveMatch);

// @route   PUT /api/matches/:matchId/status
// @desc    Update match status (accept, decline, etc.)
// @access  Private
router.put('/:matchId/status', authenticateToken, updateMatchStatus);

// @route   DELETE /api/matches/:matchId
// @desc    Delete a saved match
// @access  Private
router.delete('/:matchId', authenticateToken, deleteMatch);

module.exports = router;

// src/routes/upload.js - COMPLETE UPLOAD ROUTES
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../middleware/auth');
const {
    uploadDocuments,
    uploadProfilePicture,
    getUserDocuments,
    deleteDocument,
    downloadDocument,
    getUploadStats,
    bulkDeleteDocuments,
    serveFile
} = require('../controllers/uploadController');

const router = express.Router();

// Ensure upload directory exists
const ensureUploadDir = async (dir) => {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        await ensureUploadDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: userId_timestamp_originalname
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = `${req.user.id}_${Date.now()}_${sanitizedName}`;
        cb(null, uniqueName);
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'text/plain': '.txt'
    };

    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files per request
    }
});

// @route   POST /api/upload/document
// @desc    Upload supporting documents for skills
// @access  Private
router.post('/document', authenticateToken, upload.array('documents', 5), uploadDocuments);

// @route   POST /api/upload/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile-picture', authenticateToken, upload.single('profilePicture'), uploadProfilePicture);

// @route   GET /api/upload/documents
// @desc    Get current user's documents
// @access  Private
router.get('/documents', authenticateToken, getUserDocuments);

// @route   GET /api/upload/stats
// @desc    Get upload statistics for current user
// @access  Private
router.get('/stats', authenticateToken, getUploadStats);

// @route   GET /api/upload/document/:documentId/download
// @desc    Download a document
// @access  Private
router.get('/document/:documentId/download', authenticateToken, downloadDocument);

// @route   DELETE /api/upload/document/:documentId
// @desc    Delete a document
// @access  Private
router.delete('/document/:documentId', authenticateToken, deleteDocument);

// @route   DELETE /api/upload/documents/bulk
// @desc    Bulk delete documents
// @access  Private
router.delete('/documents/bulk', authenticateToken, bulkDeleteDocuments);

// @route   GET /api/upload/file/:filename
// @desc    Serve uploaded files (for development)
// @access  Public (but files are named with user IDs for security)
router.get('/file/:filename', serveFile);

// Error handling for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 5 files per upload.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field.'
            });
        }
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next(error);
});

module.exports = router;