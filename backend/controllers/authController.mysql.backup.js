const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

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

    const { username, email, password, role } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this username or email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertId, 
        username, 
        role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        role
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

    let users;
    
    // For students, allow login with username, email, or roll number
    if (role === 'student') {
      [users] = await pool.execute(
        'SELECT * FROM users WHERE (username = ? OR email = ? OR roll_number = ?) AND role = ?',
        [username, username, username, role]
      );
    } else {
      // For admin and organization, use username only
      [users] = await pool.execute(
        'SELECT * FROM users WHERE username = ? AND role = ?',
        [username, role]
      );
    }

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or role'
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
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
        const [orgRows] = await pool.execute(
          `SELECT os.organization_id, u.username AS organization_name
           FROM organization_students os
           JOIN users u ON os.organization_id = u.id
           WHERE os.student_id = ? AND os.status = 'active'
           LIMIT 1`,
          [user.id]
        );
        if (orgRows.length > 0) {
          organizationInfo = orgRows[0];
        }
      } catch (e) {
        // Non-fatal: don't block login if org lookup fails
        console.warn('Login org lookup failed:', e?.message || e);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
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
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        // provide org info for students to avoid extra roundtrip
        ...(organizationInfo ? {
          organization_id: organizationInfo.organization_id,
          organization_name: organizationInfo.organization_name
        } : {})
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

    const [users] = await pool.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const baseUser = users[0];
    if (baseUser.role === 'student') {
      try {
        const [orgRows] = await pool.execute(
          `SELECT os.organization_id, u.username AS organization_name
           FROM organization_students os
           JOIN users u ON os.organization_id = u.id
           WHERE os.student_id = ? AND os.status = 'active'
           LIMIT 1`,
          [baseUser.id]
        );
        if (orgRows.length > 0) {
          baseUser.organization_id = orgRows[0].organization_id;
          baseUser.organization_name = orgRows[0].organization_name;
        }
      } catch (e) {
        console.warn('Profile org lookup failed:', e?.message || e);
      }
    }

    res.status(200).json({
      success: true,
      user: baseUser
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
      return res.status(400).json({ success: false, message: 'No updatable fields provided' });
    }

    // Check if username already taken
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // Update username
    await pool.execute('UPDATE users SET username = ? WHERE id = ?', [username, userId]);

    // Return updated user info
    const [users] = await pool.execute('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [userId]);
    res.status(200).json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};