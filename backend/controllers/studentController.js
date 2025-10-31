const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Announcement = require('../models/Announcement');
const OrganizationStudent = require('../models/OrganizationStudent');
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');

// Helper function to format MongoDB document to match MySQL response
const formatEvent = (event) => ({
  ...event,
  id: event._id,
  organization_id: event.organizationId,
  start_date: event.startDate,
  end_date: event.endDate,
  max_participants: event.maxParticipants,
  registration_deadline: event.registrationDeadline,
  approval_status: event.approvalStatus,
  event_code: event.eventCode,
  created_by_type: event.createdByType,
  created_by_id: event.createdById,
  approved_by: event.approvedBy,
  approved_at: event.approvedAt,
  created_at: event.createdAt,
  updated_at: event.updatedAt
});

// Get announcements for student's organization
const getStudentAnnouncements = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const studentOrg = await OrganizationStudent.findOne({
      studentId,
      status: 'active'
    });

    if (!studentOrg) {
      return res.status(404).json({
        success: false,
        message: 'Student is not associated with any organization'
      });
    }

    const announcements = await Announcement.find({ organizationId: studentOrg.organizationId })
      .populate('organizationId', 'username')
      .sort({ createdAt: -1 })
      .lean();

    const formattedAnnouncements = announcements.map(a => ({
      ...a,
      id: a._id,
      organization_id: a.organizationId._id,
      author: a.organizationId.username,
      created_at: a.createdAt,
      updated_at: a.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedAnnouncements
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

    const studentOrg = await OrganizationStudent.findOne({
      studentId,
      status: 'active'
    });

    if (!studentOrg) {
      return res.status(404).json({
        success: false,
        message: 'Student is not associated with any organization'
      });
    }

    const events = await Event.find({
      organizationId: studentOrg.organizationId,
      $or: [
        { approvalStatus: 'approved' },
        { createdByType: 'organization' }
      ]
    }).sort({ startDate: 1 }).lean();

    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      const registeredCount = await EventRegistration.countDocuments({
        eventId: event._id,
        status: 'registered'
      });

      const isRegistered = await EventRegistration.exists({
        eventId: event._id,
        studentId,
        status: 'registered'
      });

      return {
        ...formatEvent(event),
        registeredCount,
        isRegistered: isRegistered ? 1 : 0
      };
    }));

    res.status(200).json({
      success: true,
      data: eventsWithDetails
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

    const registrations = await EventRegistration.find({
      studentId,
      status: 'registered'
    }).populate('eventId').lean();

    const events = registrations
      .filter(r => r.eventId)
      .map(r => ({
        ...formatEvent(r.eventId),
        registration_id: r._id,
        registered_at: r.createdAt
      }));

    res.status(200).json({
      success: true,
      data: events
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

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (new Date(event.registrationDeadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    const existingRegistration = await EventRegistration.findOne({
      eventId,
      studentId
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    if (event.maxParticipants) {
      const registeredCount = await EventRegistration.countDocuments({
        eventId,
        status: 'registered'
      });

      if (registeredCount >= event.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Event is full'
        });
      }
    }

    const registration = new EventRegistration({
      eventId,
      studentId,
      status: 'registered'
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: {
        registration_id: registration._id,
        event_id: eventId,
        student_id: studentId
      }
    });

  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student dashboard data
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const studentOrg = await OrganizationStudent.findOne({
      studentId,
      status: 'active'
    }).populate('organizationId', 'username email');

    if (!studentOrg) {
      return res.status(404).json({
        success: false,
        message: 'Student is not associated with any organization'
      });
    }

    const [upcomingEvents, registeredEvents, announcements] = await Promise.all([
      Event.find({
        organizationId: studentOrg.organizationId,
        startDate: { $gte: new Date() },
        $or: [
          { approvalStatus: 'approved' },
          { createdByType: 'organization' }
        ]
      }).limit(5).sort({ startDate: 1 }).lean(),

      EventRegistration.find({ studentId, status: 'registered' })
        .populate('eventId')
        .limit(5)
        .sort({ createdAt: -1 })
        .lean(),

      Announcement.find({ organizationId: studentOrg.organizationId })
        .limit(5)
        .sort({ createdAt: -1 })
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        organization: {
          id: studentOrg.organizationId._id,
          name: studentOrg.organizationId.username,
          email: studentOrg.organizationId.email
        },
        upcomingEvents: upcomingEvents.map(formatEvent),
        registeredEvents: registeredEvents
          .filter(r => r.eventId)
          .map(r => formatEvent(r.eventId)),
        announcements: announcements.map(a => ({
          ...a,
          id: a._id,
          created_at: a.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create student event
const createStudentEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const studentId = req.user.userId;
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
      registrationDeadline,
      visibility
    } = req.body;

    const studentOrg = await OrganizationStudent.findOne({
      studentId,
      status: 'active'
    });

    if (!studentOrg) {
      return res.status(404).json({
        success: false,
        message: 'Student is not associated with any organization'
      });
    }

    const event = new Event({
      organizationId: studentOrg.organizationId,
      title,
      description,
      type,
      startDate,
      endDate,
      venue,
      maxParticipants,
      requirements,
      prizes,
      registrationDeadline,
      visibility,
      approvalStatus: 'pending',
      createdByType: 'student',
      createdById: studentId
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully and sent for approval',
      data: formatEvent(event.toObject())
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

// Join private event
const joinPrivateEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { eventCode } = req.body;
    const studentId = req.user.userId;

    const event = await Event.findOne({
      eventCode,
      visibility: 'private'
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Invalid event code'
      });
    }

    if (new Date(event.registrationDeadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    const existingRegistration = await EventRegistration.findOne({
      eventId: event._id,
      studentId
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    if (event.maxParticipants) {
      const registeredCount = await EventRegistration.countDocuments({
        eventId: event._id,
        status: 'registered'
      });

      if (registeredCount >= event.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Event is full'
        });
      }
    }

    const registration = new EventRegistration({
      eventId: event._id,
      studentId,
      status: 'registered'
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Successfully joined private event',
      data: formatEvent(event.toObject())
    });

  } catch (error) {
    console.error('Join private event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student created events
const getStudentCreatedEvents = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const events = await Event.find({
      createdById: studentId,
      createdByType: 'student'
    }).sort({ createdAt: -1 }).lean();

    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      const registeredCount = await EventRegistration.countDocuments({
        eventId: event._id,
        status: 'registered'
      });

      return {
        ...formatEvent(event),
        registeredCount
      };
    }));

    res.status(200).json({
      success: true,
      data: eventsWithDetails
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

// Get student membership
const getStudentMembership = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const membership = await OrganizationStudent.findOne({ studentId })
      .populate('organizationId', 'username email')
      .lean();

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'No membership found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...membership,
        id: membership._id,
        student_id: membership.studentId,
        organization_id: membership.organizationId._id,
        organization_name: membership.organizationId.username,
        organization_email: membership.organizationId.email,
        joined_at: membership.createdAt
      }
    });

  } catch (error) {
    console.error('Get student membership error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership',
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
  getStudentMembership
};
