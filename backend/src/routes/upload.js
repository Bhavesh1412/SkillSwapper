// File upload routes for documents and profile pictures

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Document, User } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

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
        const uniqueName = `${req.user.id}_${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    // Allowed file types
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
router.post('/document', authenticateToken, upload.array('documents', 5), async (req, res) => {
    try {
        const userId = req.user.id;
        const { skillId } = req.body; // Optional: associate with specific skill

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedDocuments = [];

        // Process each uploaded file
        for (const file of req.files) {
            const fileInfo = {
                file_name: file.originalname,
                file_path: `/uploads/${file.filename}`,
                file_type: file.mimetype,
                file_size: file.size,
                skill_id: skillId ? parseInt(skillId) : null
            };

            // Save document info to database
            const documentId = await Document.create(userId, fileInfo);

            uploadedDocuments.push({
                id: documentId,
                ...fileInfo,
                uploaded_at: new Date()
            });
        }

        res.json({
            success: true,
            message: `Successfully uploaded ${uploadedDocuments.length} document(s)`,
            data: {
                documents: uploadedDocuments
            }
        });
    } catch (error) {
        console.error('Document upload error:', error);
        
        // Clean up uploaded files on error
        if (req.files) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Failed to cleanup file:', unlinkError);
                }
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload documents'
        });
    }
});

// @route   POST /api/upload/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No profile picture uploaded'
            });
        }

        // Validate that it's an image
        if (!req.file.mimetype.startsWith('image/')) {
            // Clean up uploaded file
            await fs.unlink(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Profile picture must be an image file'
            });
        }

        const profilePicPath = `/uploads/${req.file.filename}`;

        // Update user's profile picture in database
        await User.update(userId, { profile_pic: profilePicPath });

        // Get updated user
        const updatedUser = await User.findById(userId);

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            data: {
                profilePicture: profilePicPath,
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    profile_pic: updatedUser.profile_pic
                }
            }
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        
        // Clean up uploaded file on error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Failed to cleanup file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload profile picture'
        });
    }
});

// @route   DELETE /api/upload/document/:documentId
// @desc    Delete a document
// @access  Private (own documents only)
router.delete('/document/:documentId', authenticateToken, async (req, res) => {
    try {
        const documentId = parseInt(req.params.documentId);
        const userId = req.user.id;

        if (!documentId || documentId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid document ID'
            });
        }

        // Get document info first
        const { query } = require('../models/database');
        const documents = await query(
            'SELECT * FROM documents WHERE id = ? AND user_id = ?',
            [documentId, userId]
        );

        if (documents.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document not found or access denied'
            });
        }

        const document = documents[0];

        // Delete file from filesystem
        const fullPath = path.join(__dirname, '../../', document.file_path);
        try {
            await fs.unlink(fullPath);
        } catch (unlinkError) {
            console.warn('Failed to delete file from filesystem:', unlinkError.message);
            // Continue with database deletion even if file deletion fails
        }

        // Delete from database
        await query('DELETE FROM documents WHERE id = ?', [documentId]);

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete document'
        });
    }
});

// @route   GET /api/upload/documents
// @desc    Get user's documents (current user or specified user)
// @access  Private
router.get('/documents', authenticateToken, async (req, res) => {
    try {
        const userId = req.query.userId ? parseInt(req.query.userId) : req.user.id;
        
        // Allow users to view their own documents or other users' documents
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
});

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