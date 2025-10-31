const { pool } = require('../config/database');
// Safe executor: prefer execute, fallback to query
const exec = (sql, params) => (
  typeof pool.execute === 'function' ? pool.execute(sql, params) : pool.query(sql, params)
);
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { sendCredentialsEmail } = require('../utils/mailer');

// Generate random username and password for organizations
const generateCredentials = () => {
  const adjectives = ['Tech', 'Smart', 'Digital', 'Modern', 'Future', 'Global', 'Elite', 'Prime', 'Advanced', 'Innovative'];
  const nouns = ['Corp', 'Systems', 'Solutions', 'Industries', 'Enterprises', 'Group', 'Labs', 'Works', 'Hub', 'Center'];
  const numbers = Math.floor(Math.random() * 100);
  
  const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${numbers}`;
  const password = `${username}@${Math.floor(Math.random() * 1000)}`;
  
  return { username: username.toLowerCase(), password };
};

// Get admin dashboard overview
const getAdminDashboard = async (req, res) => {
  try {
    // Get total counts for dashboard overview
    const [organizationCount] = await exec(
      'SELECT COUNT(*) as count FROM users WHERE role = "organization"'
    );

    const [studentCount] = await exec(
      'SELECT COUNT(*) as count FROM users WHERE role = "student"'
    );

    const [eventCount] = await exec(
      'SELECT COUNT(*) as count FROM events'
    );

    const [announcementCount] = await exec(
      'SELECT COUNT(*) as count FROM announcements'
    );

    // Get pending organization requests
    const [pendingOrganizations] = await exec(
      'SELECT COUNT(*) as count FROM organization_requests WHERE status = "pending"'
    );

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrganizations: organizationCount[0].count,
          totalStudents: studentCount[0].count,
          totalEvents: eventCount[0].count,
          totalAnnouncements: announcementCount[0].count,
          pendingRequests: pendingOrganizations[0].count
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all organizations with their status
const getAllOrganizations = async (req, res) => {
  try {
    const [organizations] = await exec(`
      SELECT u.id, u.username, u.email, u.created_at,
             COUNT(os.student_id) as student_count,
             COUNT(e.id) as event_count,
             u.status
      FROM users u
      LEFT JOIN organization_students os ON u.id = os.organization_id AND os.status = 'active'
      LEFT JOIN events e ON u.id = e.organization_id
      WHERE u.role = 'organization'
      GROUP BY u.id, u.username, u.email, u.created_at, u.status
      ORDER BY u.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: organizations
    });

  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get pending organization requests
const getPendingOrganizations = async (req, res) => {
  try {
    const [pendingRequests] = await exec(`
      SELECT * FROM organization_requests 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: pendingRequests
    });

  } catch (error) {
    console.error('Get pending organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending organization requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Approve organization request and create credentials
const approveOrganization = async (req, res) => {
  try {
    const { requestId } = req.body;
    const adminId = req.user.userId;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    // Get the organization request details
    const [request] = await exec(
      'SELECT * FROM organization_requests WHERE id = ? AND status = "pending"',
      [requestId]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization request not found or already processed'
      });
    }

    const orgRequest = request[0];

    // Generate credentials
    const credentials = generateCredentials();
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(credentials.password, saltRounds);

    // Create the organization user account
    const [result] = await exec(
      'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [credentials.username, orgRequest.email, hashedPassword, 'organization', 'active']
    );

    const organizationId = result.insertId;

    // Update the request status
    await exec(
      'UPDATE organization_requests SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, generated_username = ?, generated_password = ? WHERE id = ?',
      ['approved', adminId, credentials.username, credentials.password, requestId]
    );

    // Try to send credentials email (non-blocking for success response)
    try {
      const { previewUrl } = await sendCredentialsEmail({
        to: orgRequest.email,
        organizationName: orgRequest.organization_name,
        username: credentials.username,
        password: credentials.password
      });
      console.log(`📧 Credentials emailed to ${orgRequest.email}`);
      if (previewUrl) {
        console.log('🔗 Email preview URL:', previewUrl);
      }
    } catch (mailErr) {
      console.warn('⚠️ Failed to send credentials email:', mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Organization approved successfully',
      data: {
        organizationId,
        organizationName: orgRequest.organization_name,
        username: credentials.username,
        password: credentials.password,
        email: orgRequest.email
      }
    });

  } catch (error) {
    console.error('Approve organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve organization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reject organization request
const rejectOrganization = async (req, res) => {
  try {
    const { requestId, reason } = req.body;
    const adminId = req.user.userId;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    // Update the request status
    await exec(
      'UPDATE organization_requests SET status = ?, rejected_by = ?, rejected_at = CURRENT_TIMESTAMP, rejection_reason = ? WHERE id = ?',
      ['rejected', adminId, reason || 'No reason provided', requestId]
    );

    res.status(200).json({
      success: true,
      message: 'Organization request rejected successfully'
    });

  } catch (error) {
    console.error('Reject organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject organization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create admin event (visible to all organizations and students)
const createAdminEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const adminId = req.user.userId;
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      venue,
      maxParticipants,
      requirements,
      prizes,
      registrationDeadline
    } = req.body;

    // Create the admin event (organization_id = null for global events)
    const [result] = await exec(`
      INSERT INTO events (
        organization_id, created_by_type, created_by_id, title, description, type, 
        start_date, end_date, venue, max_participants, requirements, prizes, 
        registration_deadline, visibility, approval_status, is_global
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      null, 'admin', adminId, title, description, type,
      startDate, endDate, venue, maxParticipants, 
      requirements || null, prizes || null,
      registrationDeadline, 'public', 'approved', true
    ]);

    const eventId = result.insertId;

    res.status(201).json({
      success: true,
      message: 'Global admin event created successfully!',
      data: {
        eventId,
        title,
        isGlobal: true
      }
    });

  } catch (error) {
    console.error('Create admin event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all events (admin can see everything)
const getAllEvents = async (req, res) => {
  try {
    const [events] = await exec(`
      SELECT e.*, 
             u.username as created_by_name,
             COUNT(DISTINCT er.id) as registeredCount,
             CASE WHEN e.organization_id IS NULL THEN 'Global Admin Event'
                  ELSE org.username END as organization_name
      FROM events e
      LEFT JOIN users u ON e.created_by_id = u.id
      LEFT JOIN users org ON e.organization_id = org.id
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
      GROUP BY e.id, e.organization_id, e.title, e.description, e.type, e.start_date, e.end_date,
               e.venue, e.max_participants, e.requirements, e.prizes, e.registration_deadline,
               e.visibility, e.approval_status, e.event_code, e.created_by_type, e.created_by_id,
               e.approved_by, e.approved_at, e.created_at, e.updated_at, e.is_global,
               u.username, org.username
      ORDER BY e.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all students across all organizations
const getAllStudents = async (req, res) => {
  try {
    const [students] = await exec(`
      SELECT s.id, s.username, s.email, s.created_at,
             org.username as organization_name,
             os.status as membership_status,
             COUNT(DISTINCT er.id) as event_registrations
      FROM users s
      LEFT JOIN organization_students os ON s.id = os.student_id
      LEFT JOIN users org ON os.organization_id = org.id
      LEFT JOIN event_registrations er ON s.id = er.student_id
      WHERE s.role = 'student'
      GROUP BY s.id, s.username, s.email, s.created_at, org.username, os.status
      ORDER BY s.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAllOrganizations,
  getPendingOrganizations,
  approveOrganization,
  rejectOrganization,
  createAdminEvent,
  getAllEvents,
  getAllStudents
};