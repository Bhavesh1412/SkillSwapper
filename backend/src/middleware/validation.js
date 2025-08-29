//user registration validation

const validateRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),

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

    body('skills-have')
        .optional()
        .isArray({ min: 0, max: 20 })
        .withMessage('You can have atmost 20 skills '),

    body('skills-want')
        .optional()
        .isArray({ min: 0, max: 20 })
        .withMessage('You can want atmost 20 skills '),


    handleValidationErrors
];



//user login validation
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];


//update profile validation

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
];