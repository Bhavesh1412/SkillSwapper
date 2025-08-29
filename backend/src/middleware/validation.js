// Input validation and sanitization middleware
const { body, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// User registration validation
const validateRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),

    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters'),

    handleValidationErrors
];

// User login validation
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),

    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters'),

    body('skills_have')
        .optional()
        .isArray({ min: 0, max: 20 })
        .withMessage('You can have at most 20 skills'),

    body('skills_want')
        .optional()
        .isArray({ min: 0, max: 20 })
        .withMessage('You can want at most 20 skills'),

    handleValidationErrors
];

// Skill validation
const validateSkills = [
    body('skills')
        .isArray({ min: 1, max: 20 })
        .withMessage('Please provide 1-20 skills'),

    body('skills.*.name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Skill name must be between 1 and 100 characters'),

    body('skills.*.level')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Invalid proficiency level'),

    handleValidationErrors
];

// ID parameter validation
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid ID parameter'),

    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateProfileUpdate,
    validateSkills,
    validateId,
    handleValidationErrors
};
