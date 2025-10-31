const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const XLSX = require('xlsx');

// Organization registration request
const submitRegistrationRequest = async (req, res) => {
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

    const { organization_name, contact_person, email, phone, address, website, description } = req.body;

    console.log('📝 Registration request received:', { organization_name, email });

    // Check if organization already requested or exists
    const [existingRequest] = await pool.execute(
      'SELECT id FROM organization_requests WHERE email = ?',
      [email]
    );

    if (existingRequest.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An organization with this email has already submitted a request'
      });
    }

    // Check if organization already exists as user
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND role = "organization"',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An organization with this email already exists'
      });
    }

    // Insert registration request
    const [result] = await pool.execute(
      `INSERT INTO organization_requests 
       (organization_name, contact_person, email, phone, address, website, description, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [organization_name, contact_person, email, phone, address, website, description]
    );

    console.log('✅ Registration request created with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully. You will receive login credentials once approved by admin.',
      requestId: result.insertId
    });

  } catch (error) {
    console.error('Registration request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while submitting registration request'
    });
  }
};

// Get organization dashboard data
const getDashboardData = async (req, res) => {
  try {
    const organizationId = req.user.userId;

    // Get students belonging to this organization
    const [students] = await pool.execute(`
      SELECT u.id, u.username as name, u.email, 
             COALESCE(u.roll_number, 'N/A') as roll_number,
             COALESCE(u.course, 'Not specified') as course,
             COALESCE(u.year, 'Not specified') as year,
             u.created_at
      FROM users u
      JOIN organization_students os ON u.id = os.student_id
      WHERE os.organization_id = ? AND os.status = 'active' AND u.role = 'student'
      ORDER BY u.course, u.year, u.username
    `, [organizationId]);

    // Get announcements count
    const [announcementCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM announcements WHERE organization_id = ?',
      [organizationId]
    );

    // Get events count
    const [eventCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM events WHERE organization_id = ?',
      [organizationId]
    );

    // Get total event registrations
    const [registrationCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE e.organization_id = ? AND er.status = 'registered'
    `, [organizationId]);

    res.status(200).json({
      success: true,
      data: {
        students: students,
        stats: {
          totalStudents: students.length,
          totalAnnouncements: announcementCount[0].count,
          totalEvents: eventCount[0].count,
          totalRegistrations: registrationCount[0].count
        }
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all announcements for an organization
const getAnnouncements = async (req, res) => {
  try {
    const organizationId = req.user.userId;

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
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new announcement
const createAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const organizationId = req.user.userId;
    const { title, content, priority } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO announcements (organization_id, title, content, priority) VALUES (?, ?, ?, ?)',
      [organizationId, title, content, priority]
    );

    // Get the created announcement
    const [announcement] = await pool.execute(`
      SELECT a.*, u.username as author
      FROM announcements a
      JOIN users u ON a.organization_id = u.id
      WHERE a.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement[0]
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all events for an organization
const getEvents = async (req, res) => {
  try {
    const organizationId = req.user.userId;

    const [events] = await pool.execute(`
      SELECT e.*, 
             COUNT(er.id) as registeredCount
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
      WHERE e.organization_id = ?
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `, [organizationId]);

    res.status(200).json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new event
const createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const organizationId = req.user.userId;
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

    const [result] = await pool.execute(`
      INSERT INTO events (
        organization_id, title, description, type, start_date, end_date,
        venue, max_participants, requirements, prizes, registration_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      organizationId, title, description, type, startDate, endDate,
      venue, maxParticipants, requirements, prizes, registrationDeadline
    ]);

    // Get the created event
    const [event] = await pool.execute(`
      SELECT e.*, 0 as registeredCount
      FROM events e
      WHERE e.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event[0]
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Register student for an event
const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const studentId = req.user.userId;

    // Check if event exists and has available spots
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

// Get pending student events for approval
const getPendingStudentEvents = async (req, res) => {
  try {
    console.log('🔍 Getting pending student events...');
    console.log('👤 User:', req.user);
    const organizationId = req.user.userId;
    console.log('🏢 Organization ID:', organizationId);

    const [events] = await pool.execute(
      `SELECT e.*, u.username as student_name, u.email as student_email,
       COUNT(er.id) as registered_count
       FROM events e
       LEFT JOIN users u ON e.created_by_id = u.id
       LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
       WHERE e.organization_id = ? AND e.created_by_type = 'student' AND e.approval_status = 'pending'
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [organizationId]
    );

    console.log('📋 Found pending events:', events.length);
    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Get pending student events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending student events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Approve or reject student event
const reviewStudentEvent = async (req, res) => {
  try {
    const organizationId = req.user.userId;
    const { eventId, action, feedback } = req.body; // action: 'approve' or 'reject'

    if (!eventId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and valid action (approve/reject) are required'
      });
    }

    // Verify the event belongs to this organization and is pending
    const [event] = await pool.execute(
      'SELECT * FROM events WHERE id = ? AND organization_id = ? AND created_by_type = "student" AND approval_status = "pending"',
      [eventId, organizationId]
    );

    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or not eligible for review'
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // Update event approval status
    await pool.execute(
      'UPDATE events SET approval_status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, organizationId, eventId]
    );

    // If rejected, we might want to notify the student (for now just log)
    if (action === 'reject') {
      console.log(`Event ${eventId} rejected by organization ${organizationId}. Feedback: ${feedback || 'No feedback provided'}`);
    }

    res.json({
      success: true,
      message: `Event ${action}d successfully`,
      data: {
        eventId,
        status: newStatus
      }
    });

  } catch (error) {
    console.error('Review student event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review student event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add individual student
const addStudent = async (req, res) => {
  try {
    const organizationId = req.user.userId;
    const { name, email, rollNumber, course, year } = req.body;

    // Validate required fields
    if (!name || !email || !rollNumber || !course || !year) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if student email already exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Check if roll number already exists in the same organization
    const [existingRollNumber] = await pool.execute(
      `SELECT u.id, u.roll_number 
       FROM users u
       INNER JOIN organization_students os ON u.id = os.student_id
       WHERE u.roll_number = ? AND os.organization_id = ? AND os.status = 'active'`,
      [rollNumber, organizationId]
    );

    if (existingRollNumber.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Roll number ${rollNumber} already exists in your organization. Each student must have a unique roll number within your organization.`
      });
    }

    // Generate password based on roll number
    const password = `${rollNumber}@CN`;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create username from email (part before @)
    const username = email.split('@')[0];

    // Insert student into users table
    const [userResult] = await pool.execute(
      `INSERT INTO users (username, email, password, role, course, year, roll_number) 
       VALUES (?, ?, ?, 'student', ?, ?, ?)`,
      [username, email, hashedPassword, course, year, rollNumber]
    );

    const studentId = userResult.insertId;

    // Link student to organization
    await pool.execute(
      `INSERT INTO organization_students (organization_id, student_id, status) 
       VALUES (?, ?, 'active')`,
      [organizationId, studentId]
    );

    console.log(`✅ Student added: ${name} (${email})`);

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      credentials: {
        email,
        password,
        rollNumber
      }
    });

  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add student',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add students in bulk
const addStudentsBulk = async (req, res) => {
  try {
    const organizationId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Debug info for uploaded file
    try {
      console.log('📥 Bulk upload received:', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (_) {}

    let rows = [];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    // Parse based on file type
  if (fileExtension === 'csv') {
      // Robust CSV parsing with BOM/CRLF handling and quoted fields support
      const raw = req.file.buffer.toString('utf-8');
      const content = raw.replace(/^\uFEFF/, ''); // strip BOM if present

      // Parse a single CSV line respecting quotes
      const parseCsvLine = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            // Handle escaped quotes "" inside quoted field
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        result.push(cur.trim());
        return result.map(v => v.replace(/^"|"$/g, ''));
      };

      // Split lines on CRLF or LF, drop empties
      const lines = content.split(/\r?\n/).filter(line => line && line.replace(/,/g, '').trim().length > 0);

      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'File is empty or has no data rows'
        });
      }

  // Parse header
      const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());

      // Convert CSV to rows array
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = (values[index] ?? '').toString().trim();
        });
        rows.push(row);
      }
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with lowercase headers
      const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      
      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty or has no data rows'
        });
      }

      // Normalize headers to lowercase
      rows = data.map(row => {
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.toLowerCase().trim()] = row[key];
        });
        return normalizedRow;
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Please upload CSV or Excel (.xlsx, .xls) files'
      });
    }

    // Validate required columns exist
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in file'
      });
    }

    console.log('🧮 Parsed data rows:', rows.length);

    const firstRow = rows[0];
    const hasName = Object.keys(firstRow).some(k => k.includes('name'));
    const hasEmail = Object.keys(firstRow).some(k => k.includes('email'));
    const hasRoll = Object.keys(firstRow).some(k => k.includes('roll'));
    const hasCourse = Object.keys(firstRow).some(k => k.includes('course'));
    const hasYear = Object.keys(firstRow).some(k => k.includes('year'));

    if (!hasName || !hasEmail || !hasRoll || !hasCourse || !hasYear) {
      return res.status(400).json({
        success: false,
        message: 'File must contain columns: Name, Email, Roll Number, Course, Year'
      });
    }

    const credentials = [];
    const errors = [];
    let successCount = 0;

    // Track roll numbers in the current file to detect duplicates within the upload
    const rollNumbersInFile = new Set();

    // Process each student
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        
        // Find the correct column names (case-insensitive, flexible matching)
        const nameKey = Object.keys(row).find(k => k.includes('name'));
        const emailKey = Object.keys(row).find(k => k.includes('email'));
        const rollKey = Object.keys(row).find(k => k.includes('roll'));
        const courseKey = Object.keys(row).find(k => k.includes('course'));
        const yearKey = Object.keys(row).find(k => k.includes('year'));

        const name = row[nameKey]?.toString().trim();
        const email = row[emailKey]?.toString().trim();
        const rollNumber = row[rollKey]?.toString().trim();
        const course = row[courseKey]?.toString().trim();
        let year = row[yearKey]?.toString().trim();

        // Normalize year values (accept 1/2/3/4 or words)
        const yearMap = {
          '1': '1st Year', '1st': '1st Year', 'first': '1st Year',
          '2': '2nd Year', '2nd': '2nd Year', 'second': '2nd Year',
          '3': '3rd Year', '3rd': '3rd Year', 'third': '3rd Year',
          '4': '4th Year', '4th': '4th Year', 'fourth': '4th Year'
        };
        const yr = year?.toLowerCase().replace(/year|\s+/g, '');
        if (yr && yearMap[yr]) year = yearMap[yr];

        if (!name || !email || !rollNumber || !course || !year) {
          errors.push({ row: i + 2, error: 'Missing required fields' });
          continue;
        }

        // Check for duplicate roll number within the file itself
        if (rollNumbersInFile.has(rollNumber)) {
          errors.push({ row: i + 2, error: `Duplicate roll number ${rollNumber} found in file` });
          continue;
        }
        rollNumbersInFile.add(rollNumber);

        // Check if student email already exists
        const [existingUser] = await pool.execute(
          'SELECT id FROM users WHERE email = ?',
          [email]
        );

        if (existingUser.length > 0) {
          errors.push({ row: i + 2, error: `Email ${email} already exists` });
          continue;
        }

        // Check if roll number already exists in the same organization
        const [existingRollNumber] = await pool.execute(
          `SELECT u.id, u.roll_number 
           FROM users u
           INNER JOIN organization_students os ON u.id = os.student_id
           WHERE u.roll_number = ? AND os.organization_id = ? AND os.status = 'active'`,
          [rollNumber, organizationId]
        );

        if (existingRollNumber.length > 0) {
          errors.push({ row: i + 2, error: `Roll number ${rollNumber} already exists in your organization` });
          continue;
        }

        // Generate password
        const password = `${rollNumber}@CN`;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create username
        const username = email.split('@')[0];

        // Insert student
        const [userResult] = await pool.execute(
          `INSERT INTO users (username, email, password, role, course, year, roll_number) 
           VALUES (?, ?, ?, 'student', ?, ?, ?)`,
          [username, email, hashedPassword, course, year, rollNumber]
        );

        const studentId = userResult.insertId;

        // Link to organization
        await pool.execute(
          `INSERT INTO organization_students (organization_id, student_id, status) 
           VALUES (?, ?, 'active')`,
          [organizationId, studentId]
        );

        credentials.push({ name, email, password, rollNumber, course, year });

        successCount++;

      } catch (err) {
        console.error(`Error processing row ${i + 2}:`, err);
        errors.push({ row: i + 2, error: err.message });
      }
    }

    console.log(`✅ Bulk upload complete: ${successCount} students added, ${errors.length} errors`);

    res.status(201).json({
      success: true,
      message: `Successfully added ${successCount} students`,
      successCount,
      credentials,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk add students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add students in bulk',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const organizationId = req.user.userId;
    const studentId = req.params.studentId;

    console.log(`🗑️ Delete request: Organization ${organizationId} wants to delete student ${studentId}`);

    // Verify the student belongs to this organization
    const [studentCheck] = await pool.execute(
      `SELECT os.id, u.username, u.email 
       FROM organization_students os
       INNER JOIN users u ON os.student_id = u.id
       WHERE os.student_id = ? AND os.organization_id = ? AND os.status = 'active'`,
      [studentId, organizationId]
    );

    if (studentCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in your organization or already removed'
      });
    }

    // Start transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Delete the user account (CASCADE will handle organization_students table)
      await connection.execute(
        'DELETE FROM users WHERE id = ? AND role = "student"',
        [studentId]
      );

      await connection.commit();
      console.log(`✅ Student ${studentCheck[0].username} (${studentCheck[0].email}) deleted successfully`);

      res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete all students in organization
const deleteAllStudents = async (req, res) => {
  try {
    const organizationId = req.user.userId;

    console.log(`🗑️🗑️ DELETE ALL request from Organization ${organizationId}`);

    // Get all students belonging to this organization
    const [studentsToDelete] = await pool.execute(
      `SELECT os.student_id, u.username, u.email 
       FROM organization_students os
       INNER JOIN users u ON os.student_id = u.id
       WHERE os.organization_id = ? AND os.status = 'active'`,
      [organizationId]
    );

    if (studentsToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found in your organization'
      });
    }

    const studentIds = studentsToDelete.map(s => s.student_id);
    const studentCount = studentIds.length;

    console.log(`⚠️ About to delete ${studentCount} students:`, studentsToDelete.map(s => s.email));

    // Start transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // First, delete all student user accounts (CASCADE will handle organization_students)
      if (studentIds.length > 0) {
        const placeholders = studentIds.map(() => '?').join(',');
        const [userResult] = await connection.execute(
          `DELETE FROM users WHERE id IN (${placeholders}) AND role = 'student'`,
          studentIds
        );

        console.log(`✓ Deleted ${userResult.affectedRows} student accounts`);
        console.log(`✓ Foreign key CASCADE will handle organization_students table cleanup`);
      }

      await connection.commit();
      console.log(`✅ Successfully deleted ALL ${studentCount} students from organization ${organizationId}`);

      res.status(200).json({
        success: true,
        message: `Successfully deleted all students from your organization`,
        deletedCount: studentCount
      });

    } catch (error) {
      await connection.rollback();
      console.error('Transaction failed, rolling back:', error);
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Delete all students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Link an existing student account (by email) to this organization
const linkExistingStudentByEmail = async (req, res) => {
  try {
    const organizationId = req.user.userId;
    const { email, rollNumber, course, year } = req.body;

    if (!email || !rollNumber || !course || !year) {
      return res.status(400).json({ success: false, message: 'Email, Roll Number, Course and Year are required' });
    }

    // Find existing student by email
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ? AND role = "student"', [email]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No student found with this email' });
    }

    const student = users[0];

    // Check if already linked
    const [links] = await pool.execute(
      'SELECT id, status FROM organization_students WHERE organization_id = ? AND student_id = ?',
      [organizationId, student.id]
    );

    if (links.length > 0) {
      // Update to active if not already
      if (links[0].status !== 'active') {
        await pool.execute('UPDATE organization_students SET status = "active" WHERE id = ?', [links[0].id]);
      }
    } else {
      await pool.execute(
        'INSERT INTO organization_students (organization_id, student_id, status) VALUES (?, ?, "active")',
        [organizationId, student.id]
      );
    }

    // Update student's academic info if provided
    await pool.execute(
      'UPDATE users SET roll_number = ?, course = ?, year = ? WHERE id = ?',
      [rollNumber, course, year, student.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Student linked to organization successfully',
      data: { studentId: student.id, email: student.email }
    });
  } catch (error) {
    console.error('Link existing student error:', error);
    res.status(500).json({ success: false, message: 'Failed to link existing student', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  submitRegistrationRequest,
  getDashboardData,
  getAnnouncements,
  createAnnouncement,
  getEvents,
  createEvent,
  registerForEvent,
  getPendingStudentEvents,
  reviewStudentEvent,
  addStudent,
  addStudentsBulk,
  deleteStudent,
  deleteAllStudents,
  // newly added export below
  linkExistingStudentByEmail
};