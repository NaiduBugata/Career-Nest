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
      name,
      role
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
        $and: [
          { role: 'student' },
          {
            $or: [
              { username },
              { email: username },
              { rollNumber: username }
            ]
          }
        ]
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

    // Check password using instance method
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
        const orgMapping = await OrganizationStudent.findOne({
          studentId: user._id,
          status: 'active'
        }).populate('organizationId', 'username');

        if (orgMapping && orgMapping.organizationId) {
          organizationInfo = {
            organization_id: orgMapping.organizationId._id,
            organization_name: orgMapping.organizationId.username
          };
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

    // Determine redirect URL based on role
    let redirectUrl;
    switch (user.role) {
      case 'admin':
        redirectUrl = '/Admin_Dashboard';
        break;
      case 'organization':
        redirectUrl = '/Organization_Dashboard';
        break;
      case 'student':
        redirectUrl = '/Student_Dashboard';
        break;
      default:
        redirectUrl = '/';
    }

    res.status(200).json({
      success: true,
      message: `Login successful as ${user.role}`,
      token,
      redirect: redirectUrl,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        // provide org info for students to avoid extra roundtrip
        ...(organizationInfo || {})
      }
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

// Get user profile (protected route)
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userObj = user.toObject();
    userObj.id = userObj._id;

    // If student, fetch organization info
    if (user.role === 'student') {
      try {
        const orgMapping = await OrganizationStudent.findOne({
          studentId: user._id,
          status: 'active'
        }).populate('organizationId', 'username');

        if (orgMapping && orgMapping.organizationId) {
          userObj.organization_id = orgMapping.organizationId._id;
          userObj.organization_name = orgMapping.organizationId.username;
        }
      } catch (e) {
        console.warn('Profile org lookup failed:', e?.message || e);
      }
    }

    res.status(200).json({
      success: true,
      user: userObj
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile (partial updates allowed) - protected
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'No updatable fields provided' 
      });
    }

    // Check if username already taken
    const existingUser = await User.findOne({ 
      username, 
      _id: { $ne: userId } 
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already taken' 
      });
    }

    // Update username
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username },
      { new: true, runValidators: true }
    ).select('-password');

    const userObj = updatedUser.toObject();
    userObj.id = userObj._id;

    res.status(200).json({ 
      success: true, 
      user: userObj 
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