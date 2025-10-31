const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const OrganizationStudent = require('../models/OrganizationStudent');

// Register user
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, role, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this username or email'
      });
    }

    // Create new user (password will be hashed by pre-save middleware)
    const user = new User({
      username,
      email,
      password,
      role,
      name: name || username
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password, role } = req.body;

    let user;
    
    // For students, allow login with username, email, or roll number
    if (role === 'student') {
      user = await User.findOne({
        $or: [
          { username },
          { email: username },
          { rollNumber: username }
        ],
        role: 'student'
      });
    } else {
      // For admin and organization, use username only
      user = await User.findOne({ username, role });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or role'
      });
    }

    // Check password using model method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If student, attempt to fetch organization mapping
    let organizationInfo = null;
    if (user.role === 'student') {
      try {
        const orgStudent = await OrganizationStudent.findOne({
          studentId: user._id,
          status: 'active'
        }).populate('organizationId', 'username name');

        if (orgStudent && orgStudent.organizationId) {
          organizationInfo = {
            organization_id: orgStudent.organizationId._id,
            organization_name: orgStudent.organizationId.username || orgStudent.organizationId.name
          };
          // Update user object with org info
          user.organizationId = orgStudent.organizationId._id;
          user.organizationName = organizationInfo.organization_name;
        }
      } catch (e) {
        // Non-fatal: don't block login if org lookup fails
        console.warn('Login org lookup failed:', e?.message || e);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare user response
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      created_at: user.createdAt,
      username_changed: user.usernameChanged
    };

    // Add student-specific fields
    if (user.role === 'student') {
      userResponse.roll_number = user.rollNumber;
      userResponse.course = user.course;
      userResponse.year = user.year;
      if (organizationInfo) {
        userResponse.organization_id = organizationInfo.organization_id;
        userResponse.organization_name = organizationInfo.organization_name;
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If student, fetch organization info
    if (user.role === 'student') {
      try {
        const orgStudent = await OrganizationStudent.findOne({
          studentId: user._id,
          status: 'active'
        }).populate('organizationId', 'username name');

        if (orgStudent && orgStudent.organizationId) {
          user.organizationId = orgStudent.organizationId._id;
          user.organizationName = orgStudent.organizationId.username || orgStudent.organizationId.name;
        }
      } catch (e) {
        console.warn('Profile org lookup failed:', e?.message || e);
      }
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      created_at: user.createdAt,
      username_changed: user.usernameChanged
    };

    // Add student-specific fields
    if (user.role === 'student') {
      userResponse.roll_number = user.rollNumber;
      userResponse.course = user.course;
      userResponse.year = user.year;
      if (user.organizationId) {
        userResponse.organization_id = user.organizationId;
        userResponse.organization_name = user.organizationName;
      }
    }

    res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { username, phone } = req.body;
    const updates = {};

    // Only allow username change if not already changed
    if (username) {
      const user = await User.findById(req.user.userId);
      if (user.usernameChanged) {
        return res.status(400).json({
          success: false,
          message: 'Username can only be changed once'
        });
      }

      // Check if username is taken
      const existing = await User.findOne({ 
        username, 
        _id: { $ne: req.user.userId } 
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Username already taken'
        });
      }

      updates.username = username;
      updates.usernameChanged = true;
    }

    if (phone) {
      updates.phone = phone;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        username_changed: user.usernameChanged
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};