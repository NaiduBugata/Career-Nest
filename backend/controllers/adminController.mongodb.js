const User = require('../models/User');
const OrganizationRequest = require('../models/OrganizationRequest');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const OrganizationStudent = require('../models/OrganizationStudent');
const EventRegistration = require('../models/EventRegistration');
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
    // Get total counts for dashboard overview using Promise.all for parallel execution
    const [
      organizationCount,
      studentCount,
      eventCount,
      announcementCount,
      pendingRequestsCount
    ] = await Promise.all([
      User.countDocuments({ role: 'organization' }),
      User.countDocuments({ role: 'student' }),
      Event.countDocuments(),
      Announcement.countDocuments(),
      OrganizationRequest.countDocuments({ status: 'pending' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrganizations: organizationCount,
          totalStudents: studentCount,
          totalEvents: eventCount,
          totalAnnouncements: announcementCount,
          pendingRequests: pendingRequestsCount
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
    // Get all organization users
    const organizations = await User.find({ role: 'organization' })
      .select('_id username email createdAt status')
      .sort({ createdAt: -1 })
      .lean();

    // Get student and event counts for each organization
    const orgData = await Promise.all(
      organizations.map(async (org) => {
        const [studentCount, eventCount] = await Promise.all([
          OrganizationStudent.countDocuments({ 
            organizationId: org._id, 
            status: 'active' 
          }),
          Event.countDocuments({ organizationId: org._id })
        ]);

        return {
          id: org._id,
          username: org.username,
          email: org.email,
          created_at: org.createdAt,
          student_count: studentCount,
          event_count: eventCount,
          status: org.status || 'active'
        };
      })
    );

    res.status(200).json({
      success: true,
      data: orgData
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
    const pendingRequests = await OrganizationRequest.find({ status: 'pending' })
      .sort({ requestDate: -1 })
      .lean();

    // Convert to match expected format
    const formattedRequests = pendingRequests.map(req => ({
      id: req._id,
      organization_name: req.organizationName,
      email: req.email,
      phone_number: req.phoneNumber,
      address: req.address,
      status: req.status,
      created_at: req.requestDate
    }));

    res.status(200).json({
      success: true,
      data: formattedRequests
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
    const orgRequest = await OrganizationRequest.findOne({ 
      _id: requestId, 
      status: 'pending' 
    });

    if (!orgRequest) {
      return res.status(404).json({
        success: false,
        message: 'Organization request not found or already processed'
      });
    }

    // Generate credentials
    const credentials = generateCredentials();
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(credentials.password, saltRounds);

    // Create the organization user account
    const newOrganization = new User({
      username: credentials.username,
      email: orgRequest.email,
      password: hashedPassword,
      role: 'organization',
      status: 'active'
    });

    await newOrganization.save();
    const organizationId = newOrganization._id;

    // Update the request status
    orgRequest.status = 'approved';
    orgRequest.reviewedBy = adminId;
    orgRequest.reviewDate = new Date();
    orgRequest.username = credentials.username;
    orgRequest.generatedPassword = credentials.password;
    await orgRequest.save();

    // Try to send credentials email (non-blocking for success response)
    try {
      const { previewUrl } = await sendCredentialsEmail({
        to: orgRequest.email,
        organizationName: orgRequest.organizationName,
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
        organizationName: orgRequest.organizationName,
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
    const orgRequest = await OrganizationRequest.findById(requestId);
    
    if (!orgRequest) {
      return res.status(404).json({
        success: false,
        message: 'Organization request not found'
      });
    }

    orgRequest.status = 'rejected';
    orgRequest.reviewedBy = adminId;
    orgRequest.reviewDate = new Date();
    orgRequest.rejectionReason = reason || 'No reason provided';
    await orgRequest.save();

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

    // Generate unique event code
    const eventCode = `ADMIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create the admin event (organizationId = null for global events)
    const newEvent = new Event({
      organizationId: null,  // Global event
      createdBy: adminId,
      createdByRole: 'admin',
      title,
      description,
      type,
      startDate,
      endDate,
      venue,
      maxParticipants,
      requirements: requirements || null,
      prizes: prizes || null,
      registrationDeadline,
      visibility: 'public',
      approvalStatus: 'approved',
      isGlobal: true,
      eventCode
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: 'Global admin event created successfully!',
      data: {
        eventId: newEvent._id,
        title: newEvent.title,
        isGlobal: true,
        eventCode: newEvent.eventCode
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
    // Get all events with populated creator and organization info
    const events = await Event.find()
      .populate('createdBy', 'username')
      .populate('organizationId', 'username')
      .sort({ createdAt: -1 })
      .lean();

    // Get registration counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await EventRegistration.countDocuments({
          eventId: event._id,
          status: 'registered'
        });

        return {
          id: event._id,
          organization_id: event.organizationId?._id || null,
          organization_name: event.organizationId 
            ? event.organizationId.username 
            : 'Global Admin Event',
          title: event.title,
          description: event.description,
          type: event.type,
          start_date: event.startDate,
          end_date: event.endDate,
          venue: event.venue,
          max_participants: event.maxParticipants,
          requirements: event.requirements,
          prizes: event.prizes,
          registration_deadline: event.registrationDeadline,
          visibility: event.visibility,
          approval_status: event.approvalStatus,
          event_code: event.eventCode,
          created_by_type: event.createdByRole,
          created_by_id: event.createdBy?._id,
          created_by_name: event.createdBy?.username,
          is_global: event.isGlobal || false,
          created_at: event.createdAt,
          updated_at: event.updatedAt,
          registeredCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: eventsWithCounts
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
    // Get all student users
    const students = await User.find({ role: 'student' })
      .select('_id username email createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get organization and event registration info for each student
    const studentsWithInfo = await Promise.all(
      students.map(async (student) => {
        // Find organization membership
        const orgMembership = await OrganizationStudent.findOne({ 
          studentId: student._id 
        })
          .populate('organizationId', 'username')
          .lean();

        // Count event registrations
        const eventRegistrations = await EventRegistration.countDocuments({
          studentId: student._id
        });

        return {
          id: student._id,
          username: student.username,
          email: student.email,
          created_at: student.createdAt,
          organization_name: orgMembership?.organizationId?.username || null,
          membership_status: orgMembership?.status || null,
          event_registrations: eventRegistrations
        };
      })
    );

    res.status(200).json({
      success: true,
      data: studentsWithInfo
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
