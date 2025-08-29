// Authentication routes - registration and login

const express = require("express");
const bcrypt = require("bcrypt");
const { User, Skill } = require("../models/database");
const { generateToken } = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public

router.post("/register", validateRegistration, async (req, res) => {
  try {
    let { name, email, password, bio, location, skills_have, skills_want } =
      req.body;

    email = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password - using 12 rounds

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = await User.create({
      name,
      email,
      password_hash,
      bio,
      location,
    });

    // Process skills if provided
    //handle "have" skills
    if (Array.isArray(skills_have)) {
      for (const skillData of skills_have) {
        const skill = await Skill.findOrCreate(skillData.name || skillData);
        await Skill.addToUserHave(
          newUserId,
          skill.id,
          skillData.level || "beginner"
        );
      }
    }

    //handle "want" skills
    if (Array.isArray(skills_want)) {
      for (const skillData of skills_want) {
        const skill = await Skill.findOrCreate(skillData.name || skillData);
        await Skill.addToUserWant(
          newUserId,
          skill.id,
          skillData.urgency || "beginner"
        );
      }
    }

    // Generate JWT token
    const token = generateToken(userId);

    // Get created user with skills
    const newUser = await User.getWithSkills(userId);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          bio: newUser.bio,
          location: newUser.location,
          skills_have: newUser.skills_have,
          skills_want: newUser.skills_want,
          created_at: newUser.created_at,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public

router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Get user with skills
    const userWithSkills = await User.getWithSkills(user.id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: userWithSkills.id,
          name: userWithSkills.name,
          email: userWithSkills.email,
          bio: userWithSkills.bio,
          location: userWithSkills.location,
          profile_pic: userWithSkills.profile_pic,
          skills_have: userWithSkills.skills_have,
          skills_want: userWithSkills.skills_want,
          created_at: userWithSkills.created_at,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/auth/verify
// @desc    Verify JWT token (useful for persistent login)
// @access  Private
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
    );

    const user = await User.getWithSkills(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Token is valid",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          location: user.location,
          profile_pic: user.profile_pic,
          skills_have: user.skills_have,
          skills_want: user.skills_want,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});

module.exports = router;
