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
      .select('_id username email name phone isActive createdAt')
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
          _id: org._id,
          username: org.username,
          email: org.email,
          name: org.name,
          phone: org.phone,
          isActive: org.isActive !== false,
          created_at: org.createdAt,
          createdAt: org.createdAt,
          student_count: studentCount,
          event_count: eventCount
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
    
    // Create the organization user account (password will be hashed by pre-save hook)
    const newOrganization = new User({
      username: credentials.username,
      email: orgRequest.email,
      name: orgRequest.organizationName,  // Use organization name as the user's name
      password: credentials.password,  // Plain password - will be hashed by model
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
      .select('_id username email name isActive createdAt')
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
          _id: student._id,
          username: student.username,
          email: student.email,
          name: student.name,
          isActive: student.isActive !== false,
          created_at: student.createdAt,
          createdAt: student.createdAt,
          organization_name: orgMembership?.organizationId?.username || null,
          membership_status: orgMembership?.status || null,
          events_count: eventRegistrations
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

// Get organization details by ID
const getOrganizationDetails = async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Get organization user details
    const organization = await User.findById(organizationId)
      .select('-password')
      .lean();

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    if (organization.role !== 'organization') {
      return res.status(400).json({
        success: false,
        message: 'User is not an organization'
      });
    }

    // Get organization statistics
    const [
      studentCount,
      eventCount,
      announcementCount,
      students,
      events,
      announcements
    ] = await Promise.all([
      OrganizationStudent.countDocuments({ organizationId: organization._id, status: 'active' }),
      Event.countDocuments({ organizationId: organization._id }),
      Announcement.countDocuments({ organizationId: organization._id }),
      OrganizationStudent.find({ organizationId: organization._id, status: 'active' })
        .populate('studentId', 'name email rollNumber course year createdAt')
        .limit(10)
        .sort({ createdAt: -1 })
        .lean(),
      Event.find({ organizationId: organization._id })
        .limit(10)
        .sort({ createdAt: -1 })
        .lean(),
      Announcement.find({ organizationId: organization._id })
        .limit(10)
        .sort({ createdAt: -1 })
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        organization: {
          id: organization._id,
          username: organization.username,
          email: organization.email,
          name: organization.name,
          phone: organization.phone,
          isActive: organization.isActive,
          createdAt: organization.createdAt,
          updatedAt: organization.updatedAt
        },
        stats: {
          totalStudents: studentCount,
          totalEvents: eventCount,
          totalAnnouncements: announcementCount
        },
        recentStudents: students.map(s => ({
          id: s.studentId?._id,
          name: s.studentId?.name,
          email: s.studentId?.email,
          rollNumber: s.studentId?.rollNumber,
          course: s.studentId?.course,
          year: s.studentId?.year,
          enrolledAt: s.createdAt
        })).filter(s => s.id),
        recentEvents: events.map(e => ({
          id: e._id,
          title: e.title,
          type: e.type,
          startDate: e.startDate,
          endDate: e.endDate,
          venue: e.venue,
          maxParticipants: e.maxParticipants,
          createdAt: e.createdAt
        })),
        recentAnnouncements: announcements.map(a => ({
          id: a._id,
          title: a.title,
          description: a.description,
          targetYear: a.targetYear,
          createdAt: a.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get organization details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user details by ID (works for any user type)
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional details based on user role
    let additionalData = {};

    if (user.role === 'organization') {
      const [studentCount, eventCount, announcementCount] = await Promise.all([
        OrganizationStudent.countDocuments({ organizationId: user._id, status: 'active' }),
        Event.countDocuments({ organizationId: user._id }),
        Announcement.countDocuments({ organizationId: user._id })
      ]);

      additionalData = {
        totalStudents: studentCount,
        totalEvents: eventCount,
        totalAnnouncements: announcementCount
      };
    } else if (user.role === 'student') {
      const [orgStudent, enrolledCourses, registeredEvents] = await Promise.all([
        OrganizationStudent.findOne({ studentId: user._id, status: 'active' })
          .populate('organizationId', 'username email name'),
        // You can add course enrollment count here if you have that model
        Promise.resolve(0),
        EventRegistration.countDocuments({ studentId: user._id, status: 'registered' })
      ]);

      additionalData = {
        organization: orgStudent?.organizationId ? {
          id: orgStudent.organizationId._id,
          name: orgStudent.organizationId.name || orgStudent.organizationId.username,
          email: orgStudent.organizationId.email
        } : null,
        course: user.course,
        year: user.year,
        rollNumber: user.rollNumber,
        registeredEvents: registeredEvents
      };
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          ...additionalData
        }
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change user password (admin privilege)
const changeUserPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (the pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Change user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Toggle user active status
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deactivating admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate admin users'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        userId: user._id,
        username: user.username,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update organization details
const updateOrganizationDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { organizationId } = req.params;
    const { name, email, phone } = req.body;

    const organization = await User.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    if (organization.role !== 'organization') {
      return res.status(400).json({
        success: false,
        message: 'User is not an organization'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== organization.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: organizationId } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
      organization.email = email;
    }

    if (name) organization.name = name;
    if (phone) organization.phone = phone;

    await organization.save();

    res.status(200).json({
      success: true,
      message: 'Organization details updated successfully',
      data: {
        id: organization._id,
        username: organization.username,
        email: organization.email,
        name: organization.name,
        phone: organization.phone
      }
    });

  } catch (error) {
    console.error('Update organization details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization details',
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
  getAllStudents,
  getOrganizationDetails,
  getUserDetails,
  changeUserPassword,
  toggleUserStatus,
  updateOrganizationDetails
};
