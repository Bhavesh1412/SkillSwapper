// 404 handler for undefined routes



const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableRoutes: {
            auth: [
                'POST /api/auth/register',
                'POST /api/auth/login'
            ],
            users: [
                'GET /api/users/profile/:id',
                'PUT /api/users/profile/:id',
                'GET /api/users/me'
            ],
            skills: [
                'GET /api/skills',
                'POST /api/skills/add-to-have',
                'POST /api/skills/add-to-want'
            ],
            matches: [
                'GET /api/matches'
            ],
            upload: [
                'POST /api/upload/document'
            ]
        }
    });
};

module.exports = notFound;