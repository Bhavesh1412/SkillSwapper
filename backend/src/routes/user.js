//User profile routes 

const express = require('express');
const { User } = require('../models/database');
const { authenticateTokens } = require('../middleware/auth');


const router = express.Router();

//@routes
//@desc GET current users profile
//access Private

router.get('/me', authenticateTokens , async (req, res) => {
      try{
            const user = await User.getWithSkills(req.user.id);

            res.jason({
                  success: true,
                  data:{
                        user:{
                              id: user.id,
                              name: user.name,
                              email: user.email,
                              bio: user.bio,
                              location: user.location,
                              profile_pic: user.profile_pic,
                              skills_have: user.skills_have,
                              skills_want: user.skills_want,
                              created_at: user.created_at,
                        }
                  }
            })
      }
      catch{}
});

