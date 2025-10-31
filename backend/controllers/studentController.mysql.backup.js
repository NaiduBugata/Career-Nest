const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

// Get announcements for student's organization
const getStudentAnnouncements = async (req, res) => {
  try {
    const studentId = req.user.userId;

    // Get the organization this student belongs to
    const [studentOrg] = await pool.execute(`
      SELECT os.organization_id 
      FROM organization_students os 
      WHERE os.student_id = ? AND os.status = 'active'
    `, [studentId]);

    if (studentOrg.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student is not associated with any organization'
      });
    }

    const organizationId = studentOrg[0].organization_id;

    // Get announcements from the student's organization
    const [announcements] = await pool.execute(`
      SELECT a.*, u.username as author
      FROM announcements a
      JOIN users u ON a.organization_id = u.id
      WHERE a.organization_id = ?
      ORDER BY a.created_at DESC
    `, [organizationId]);

    res.status(200).json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Get student announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get events for student's organization
const getStudentEvents = async (req, res) => {
  try {
    const studentId = req.user.userId;

    // Get the organization this student belongs to
    const [studentOrg] = await pool.execute(`
      SELECT os.organization_id 
      FROM organization_students os 
      WHERE os.student_id = ? AND os.status = 'active'
    `, [studentId]);

    if (studentOrg.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student is not associated with any organization'
      });
    }

    const organizationId = studentOrg[0].organization_id;

    // Get events from the student's organization with registration count
    const [events] = await pool.execute(`
      SELECT e.*, 
             COUNT(DISTINCT er.id) as registeredCount,
             MAX(CASE WHEN ser.student_id = ? THEN 1 ELSE 0 END) as isRegistered
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
      LEFT JOIN event_registrations ser ON e.id = ser.event_id AND ser.student_id = ? AND ser.status = 'registered'
      WHERE e.organization_id = ? AND (e.approval_status = 'approved' OR e.created_by_type = 'organization')
      GROUP BY e.id, e.organization_id, e.title, e.description, e.type, e.start_date, e.end_date, 
               e.venue, e.max_participants, e.requirements, e.prizes, e.registration_deadline, 
               e.visibility, e.approval_status, e.event_code, e.created_by_type, e.created_by_id, 
               e.approved_by, e.approved_at, e.created_at, e.updated_at
      ORDER BY e.start_date ASC
    `, [studentId, studentId, organizationId]);

    res.status(200).json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Get student events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student's registered events
const getStudentRegisteredEvents = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [registeredEvents] = await pool.execute(`
      SELECT er.*, e.title, e.description, e.start_date, e.end_date, e.venue, e.type,
             u.username as organization_name
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN users u ON e.organization_id = u.id
      WHERE er.student_id = ?
      ORDER BY er.registration_date DESC
    `, [studentId]);

    res.status(200).json({
      success: true,
      data: registeredEvents
    });

  } catch (error) {
    console.error('Get registered events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registered events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Register for an event
const registerForEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { eventId } = req.body;
    const studentId = req.user.userId;

    // Check if event exists and get organization
    const [events] = await pool.execute(`
      SELECT e.*, COUNT(er.id) as registeredCount
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
      WHERE e.id = ?
      GROUP BY e.id
    `, [eventId]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = events[0];

    // Check if student belongs to the same organization as the event
    const [studentOrg] = await pool.execute(`
      SELECT organization_id 
      FROM organization_students 
      WHERE student_id = ? AND status = 'active'
    `, [studentId]);

    if (studentOrg.length === 0 || studentOrg[0].organization_id !== event.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only register for events from your organization'
      });
    }

    // Check if registration deadline has passed
    if (new Date() > new Date(event.registration_deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if event is full
    if (event.registeredCount >= event.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Check if student is already registered
    const [existingRegistration] = await pool.execute(
      'SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ?',
      [eventId, studentId]
    );

    if (existingRegistration.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // Register the student
    await pool.execute(
      'INSERT INTO event_registrations (event_id, student_id) VALUES (?, ?)',
      [eventId, studentId]
    );

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event'
    });

  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student dashboard overview
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.userId;

    // Get student's organization
    const [studentOrg] = await pool.execute(`
      SELECT os.organization_id, u.username as organization_name
      FROM organization_students os 
      JOIN users u ON os.organization_id = u.id
      WHERE os.student_id = ? AND os.status = 'active'
    `, [studentId]);

    if (studentOrg.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student is not associated with any organization'
      });
    }

    const organizationId = studentOrg[0].organization_id;
    const organizationName = studentOrg[0].organization_name;

    // Get counts
    const [announcementCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM announcements WHERE organization_id = ?',
      [organizationId]
    );

    const [eventCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM events WHERE organization_id = ?',
      [organizationId]
    );

    const [registrationCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM event_registrations WHERE student_id = ?',
      [studentId]
    );

    res.status(200).json({
      success: true,
      data: {
        organization: organizationName,
        stats: {
          announcements: announcementCount[0].count,
          events: eventCount[0].count,
          registrations: registrationCount[0].count
        }
      }
    });

  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate random event code
const generateEventCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create a new event by student
const createStudentEvent = async (req, res) => {
  try {
    // Debug: Log the incoming request body
    console.log('📝 Create Event Request Body:', JSON.stringify(req.body, null, 2));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const studentId = req.user.userId;
    console.log('👤 Student ID:', studentId);
    const {
      title,
      description,
      type,
      start_date,
      end_date,
      venue,
      max_participants,
      requirements,
      prizes,
      registration_deadline,
      visibility
    } = req.body;

    // Validate required fields
    if (!title || !description || !type || !start_date || !end_date || !venue || !max_participants || !registration_deadline || !visibility) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate date formats and logic
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const regDeadline = new Date(registration_deadline);
    const today = new Date();

    console.log('📅 Date validation:', {
      start_date,
      startDate: startDate.toISOString(),
      end_date,
      endDate: endDate.toISOString(),
      registration_deadline,
      regDeadline: regDeadline.toISOString()
    });

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(regDeadline.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }

    if (startDate <= today) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be in the future'
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    if (regDeadline >= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline must be before the event start date'
      });
    }

    // Get student's organization
    const [studentOrg] = await pool.execute(
      'SELECT organization_id FROM organization_students WHERE student_id = ? AND status = "active"',
      [studentId]
    );

    if (studentOrg.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student must belong to an organization to create events'
      });
    }

    const organizationId = studentOrg[0].organization_id;

    // Generate event code for private events
    let eventCode = null;
    if (visibility === 'private') {
      let codeExists = true;
      while (codeExists) {
        eventCode = generateEventCode();
        const [existingCode] = await pool.execute(
          'SELECT id FROM events WHERE event_code = ?',
          [eventCode]
        );
        codeExists = existingCode.length > 0;
      }
    }

    // Set approval status based on visibility
    let approvalStatus = 'approved'; // Private events are auto-approved
    if (visibility === 'public') {
      approvalStatus = 'pending'; // Public events need approval
    }

    // Prepare parameters, converting undefined to null
    const insertParams = [
      organizationId, 
      'student', 
      studentId, 
      title, 
      description, 
      type,
      start_date, 
      end_date, 
      venue, 
      parseInt(max_participants), 
      requirements || null, 
      prizes || null,
      registration_deadline, 
      visibility, 
      approvalStatus, 
      eventCode || null
    ];
    
    console.log('📊 Insert parameters:', insertParams.map((p, i) => `${i}: ${p === undefined ? 'UNDEFINED' : p === null ? 'NULL' : typeof p === 'string' ? `"${p}"` : p}`));
    
    // Create the event
    const [result] = await pool.execute(
      `INSERT INTO events (
        organization_id, created_by_type, created_by_id, title, description, type, 
        start_date, end_date, venue, max_participants, requirements, prizes, 
        registration_deadline, visibility, approval_status, event_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertParams
    );

    const eventId = result.insertId;

    // Add creator to student_events table
    await pool.execute(
      'INSERT INTO student_events (student_id, event_id, is_creator) VALUES (?, ?, ?)',
      [studentId, eventId, true]
    );

    // Auto-register creator for their own event
    await pool.execute(
      'INSERT INTO event_registrations (event_id, student_id) VALUES (?, ?)',
      [eventId, studentId]
    );

    res.status(201).json({
      success: true,
      message: `Event created successfully! ${visibility === 'private' ? `Event code: ${eventCode}` : 'Waiting for approval from organization.'}`,
      data: {
        eventId,
        eventCode: visibility === 'private' ? eventCode : null,
        approvalStatus
      }
    });

  } catch (error) {
    console.error('Create student event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Join private event using code
const joinPrivateEvent = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { eventCode } = req.body;

    console.log('🔐 Join Private Event Request:');
    console.log('👤 Student ID:', studentId);
    console.log('🎫 Event Code:', eventCode);

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: 'Event code is required'
      });
    }

    // Find the event by code
    const [event] = await pool.execute(
      'SELECT * FROM events WHERE event_code = ? AND visibility = "private"',
      [eventCode]
    );

    console.log('🔍 Events found:', event.length);

    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid event code'
      });
    }

    const eventData = event[0];
    console.log('🎉 Event found:', eventData.title, 'ID:', eventData.id);

    // Check if registration deadline has passed
    if (new Date() > new Date(eventData.registration_deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if event is full
    const [registrations] = await pool.execute(
      'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ? AND status = "registered"',
      [eventData.id]
    );

    console.log('📊 Current registrations:', registrations[0].count, '/', eventData.max_participants);

    if (registrations[0].count >= eventData.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Check if student is already registered
    const [existingRegistration] = await pool.execute(
      'SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ?',
      [eventData.id, studentId]
    );

    console.log('📝 Existing registrations for this student:', existingRegistration.length);

    if (existingRegistration.length > 0) {
      console.log('❌ Student already registered');
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    console.log('✅ Proceeding with registration...');

    // Register student for the event
    await pool.execute(
      'INSERT INTO event_registrations (event_id, student_id) VALUES (?, ?)',
      [eventData.id, studentId]
    );

    console.log('✅ Registration successful!');

    // Add to student_events tracking
    await pool.execute(
      'INSERT INTO student_events (student_id, event_id, is_creator) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE joined_at = CURRENT_TIMESTAMP',
      [studentId, eventData.id, false]
    );

    res.json({
      success: true,
      message: 'Successfully joined the private event!',
      data: {
        eventId: eventData.id,
        eventTitle: eventData.title
      }
    });

  } catch (error) {
    console.error('Join private event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join private event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student's created events
const getStudentCreatedEvents = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [events] = await pool.execute(
      `SELECT e.*, 
       COUNT(er.id) as registered_count,
       u.username as organization_name
       FROM events e
       LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
       LEFT JOIN users u ON e.organization_id = u.id
       WHERE e.created_by_type = 'student' AND e.created_by_id = ?
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Get student created events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch created events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student's organization membership info
const getStudentMembership = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [orgs] = await pool.execute(`
      SELECT os.organization_id, u.username as organization_name, os.status, os.joined_at
      FROM organization_students os
      JOIN users u ON os.organization_id = u.id
      WHERE os.student_id = ?
      ORDER BY FIELD(os.status, 'active', 'pending', 'rejected')
    `, [studentId]);

    if (orgs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          memberships: [],
          hasActive: false
        }
      });
    }

    const hasActive = orgs.some(o => o.status === 'active');

    res.status(200).json({
      success: true,
      data: {
        memberships: orgs,
        hasActive
      }
    });
  } catch (error) {
    console.error('Get student membership error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getStudentAnnouncements,
  getStudentEvents,
  getStudentRegisteredEvents,
  registerForEvent,
  getStudentDashboard,
  createStudentEvent,
  joinPrivateEvent,
  getStudentCreatedEvents,
  // Newly added export
  getStudentMembership
};