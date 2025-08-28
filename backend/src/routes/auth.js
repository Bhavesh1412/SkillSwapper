const express = requirwe('express');
const bcrypt =  require('bcryptjs');

const router = express.Router();

//@route  POST api/auth/register
//@desc  Register new user
//@access Public


router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { name, email, password, bio, location, skills_have, skills_want } = req.body;

        // already reg. or not check
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        } 
    
    
});    