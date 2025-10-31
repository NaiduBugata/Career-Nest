const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("../models/User");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const Announcement = require("../models/Announcement");
const OrganizationStudent = require("../models/OrganizationStudent");
const OrganizationRequest = require("../models/OrganizationRequest");

const formatEvent = (event) => {
  return {
    id: event._id,
    organization_id: event.organizationId,
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
    created_by_type: event.createdByType,
    created_by_id: event.createdById,
    quiz_data: event.quizData,
    created_at: event.createdAt,
    updated_at: event.updatedAt
  };
};

const submitRegistrationRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: errors.array() 
      });
    }

    const { 
      organization_name, 
      contact_person, 
      email, 
      description,
      phone,
      website,
      address 
    } = req.body;

    // Check if email already exists in users or pending requests
    const [existingUser, existingRequest] = await Promise.all([
      User.findOne({ email }),
      OrganizationRequest.findOne({ email, status: 'pending' })
    ]);

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: "An organization with this email already exists" 
      });
    }

    if (existingRequest) {
      return res.status(409).json({ 
        success: false, 
        message: "A registration request with this email is already pending approval" 
      });
    }

    // Create organization request
    const orgRequest = new OrganizationRequest({
      organizationName: organization_name,
      email: email.toLowerCase(),
      phoneNumber: phone || '',
      address: address || '',
      status: 'pending',
      requestDate: new Date()
    });

    await orgRequest.save();

    res.status(201).json({ 
      success: true, 
      message: "Registration request submitted successfully. You will receive credentials via email once approved.",
      data: { 
        id: orgRequest._id, 
        organization_name: orgRequest.organizationName, 
        email: orgRequest.email,
        status: orgRequest.status
      } 
    });

  } catch (error) {
    console.error("Submit registration error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to submit registration", 
      error: process.env.NODE_ENV === "development" ? error.message : undefined 
    });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const organizationId = req.user.userId;
    const [totalStudents, totalEvents, totalAnnouncements, upcomingEvents, recentAnnouncements] = await Promise.all([
      OrganizationStudent.countDocuments({ organizationId, status: "active" }),
      Event.countDocuments({ organizationId }),
      Announcement.countDocuments({ organizationId }),
      Event.find({ organizationId, startDate: { $gte: new Date() } }).limit(5).sort({ startDate: 1 }).lean(),
      Announcement.find({ organizationId }).limit(5).sort({ createdAt: -1 }).lean()
    ]);
    res.status(200).json({ success: true, data: { totalStudents, totalEvents, totalAnnouncements, upcomingEvents: upcomingEvents.map(e => formatEvent(e)), recentAnnouncements: recentAnnouncements.map(a => ({ id: a._id, organization_id: a.organizationId, title: a.title, content: a.content, priority: a.priority, created_at: a.createdAt })) } });
  } catch (error) {
    console.error("Get dashboard data error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const organizationId = req.user.userId;
    const announcements = await Announcement.find({ organizationId }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: announcements.map(a => ({ id: a._id, organization_id: a.organizationId, title: a.title, content: a.content, priority: a.priority, created_at: a.createdAt, updated_at: a.updatedAt })) });
  } catch (error) {
    console.error("Get announcements error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch announcements", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const organizationId = req.user.userId;
    const { title, content, priority } = req.body;
    
    // Get organization details for author field - FIXED
    const organization = await User.findById(organizationId);
    const authorName = organization ? organization.username : 'Organization';
    
    const announcement = new Announcement({ 
      organizationId, 
      title, 
      content, 
      priority: priority || "normal",
      createdBy: organizationId,
      createdByRole: 'organization',
      author: authorName
    });
    await announcement.save();
    res.status(201).json({ success: true, message: "Announcement created successfully", data: { id: announcement._id, organization_id: organizationId, title: announcement.title, content: announcement.content, priority: announcement.priority, created_at: announcement.createdAt } });
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ success: false, message: "Failed to create announcement", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const getEvents = async (req, res) => {
  try {
    const organizationId = req.user.userId;
    const events = await Event.find({ organizationId }).sort({ createdAt: -1 }).lean();
    const eventsWithCounts = await Promise.all(events.map(async (event) => {
      const registeredCount = await EventRegistration.countDocuments({ eventId: event._id, status: "registered" });
      return { ...formatEvent(event), registeredCount };
    }));
    res.status(200).json({ success: true, data: eventsWithCounts });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch events", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const organizationId = req.user.userId;
    const { title, description, type, startDate, endDate, venue, maxParticipants, requirements, prizes, registrationDeadline, visibility, quizData } = req.body;
    let eventCode = null;
    if (visibility === "private") {
      eventCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    const event = new Event({ organizationId, title, description, type, startDate, endDate, venue, maxParticipants, requirements, prizes, registrationDeadline, visibility, eventCode, approvalStatus: "approved", createdByType: "organization", createdById: organizationId, quizData });
    await event.save();
    res.status(201).json({ success: true, message: "Event created successfully", data: formatEvent(event.toObject()) });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ success: false, message: "Failed to create event", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const registerForEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const { eventId, studentId } = req.body;
    const organizationId = req.user.userId;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    const studentOrg = await OrganizationStudent.findOne({ organizationId, studentId, status: "active" });
    if (!studentOrg) {
      return res.status(403).json({ success: false, message: "Student does not belong to your organization" });
    }
    const existingRegistration = await EventRegistration.findOne({ eventId, studentId });
    if (existingRegistration) {
      return res.status(409).json({ success: false, message: "Student already registered for this event" });
    }
    const registration = new EventRegistration({ eventId, studentId, status: "registered" });
    await registration.save();
    res.status(201).json({ success: true, message: "Student registered for event successfully", data: { registration_id: registration._id, event_id: eventId, student_id: studentId } });
  } catch (error) {
    console.error("Register for event error:", error);
    res.status(500).json({ success: false, message: "Failed to register student", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const getPendingStudentEvents = async (req, res) => {
  try {
    const organizationId = req.user.userId;
    const pendingEvents = await Event.find({ organizationId, createdByType: "student", approvalStatus: "pending" }).populate("createdById", "username email").sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: pendingEvents.map(e => ({ ...formatEvent(e), created_by_name: e.createdById?.username, created_by_email: e.createdById?.email })) });
  } catch (error) {
    console.error("Get pending student events error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch pending events", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const reviewStudentEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const { eventId, status } = req.body;
    const organizationId = req.user.userId;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
    }
    const event = await Event.findOne({ _id: eventId, organizationId, createdByType: "student" });
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    event.approvalStatus = status;
    event.approvedBy = organizationId;
    event.approvedAt = new Date();
    await event.save();
    res.status(200).json({ success: true, message: `Event ${status} successfully`, data: formatEvent(event.toObject()) });
  } catch (error) {
    console.error("Review student event error:", error);
    res.status(500).json({ success: false, message: "Failed to review event", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const addStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const organizationId = req.user.userId;
    let { username, email, name, rollNumber, course, year } = req.body;
    
    // Auto-generate username if not provided (use rollNumber or email prefix)
    if (!username) {
      username = rollNumber || email.split('@')[0];
    }
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }, { rollNumber }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Student already exists with this username, email, or roll number" });
    }
    const tempPassword = Math.random().toString(36).slice(-8);
    const student = new User({ username, email, name, password: tempPassword, role: "student", rollNumber, course, year });
    await student.save();
  const orgStudent = new OrganizationStudent({ organizationId, studentId: student._id, rollNumber, course, year, status: "active" });
    await orgStudent.save();
    res.status(201).json({ success: true, message: "Student added successfully", data: { id: student._id, username: student.username, email: student.email, name: student.name, rollNumber: student.rollNumber, temporaryPassword: tempPassword } });
  } catch (error) {
    console.error("Add student error:", error);
    res.status(500).json({ success: false, message: "Failed to add student", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const addStudentsBulk = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const organizationId = req.user.userId;
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: "Students array is required and must not be empty" });
    }
    const results = { successful: [], failed: [] };
    for (const studentData of students) {
      try {
        let { username, email, name, rollNumber, course, year } = studentData;
        
        // Auto-generate username if not provided
        if (!username) {
          username = rollNumber || email.split('@')[0];
        }
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }, ...(rollNumber ? [{ rollNumber }] : [])] });
        if (existingUser) {
          results.failed.push({ ...studentData, reason: "Already exists" });
          continue;
        }
        const tempPassword = Math.random().toString(36).slice(-8);
        const student = new User({ username, email, name, password: tempPassword, role: "student", rollNumber, course, year });
        await student.save();
  const orgStudent = new OrganizationStudent({ organizationId, studentId: student._id, rollNumber, course, year, status: "active" });
        await orgStudent.save();
        results.successful.push({ id: student._id, username, email, name, temporaryPassword: tempPassword });
      } catch (err) {
        results.failed.push({ ...studentData, reason: err.message });
      }
    }
    res.status(201).json({ success: true, message: `Bulk upload completed: ${results.successful.length} successful, ${results.failed.length} failed`, data: results });
  } catch (error) {
    console.error("Bulk add students error:", error);
    res.status(500).json({ success: false, message: "Failed to add students in bulk", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const organizationId = req.user.userId;
    const orgStudent = await OrganizationStudent.findOne({ organizationId, studentId });
    if (!orgStudent) {
      return res.status(404).json({ success: false, message: "Student not found in your organization" });
    }
    await OrganizationStudent.deleteOne({ _id: orgStudent._id });
    const otherOrgs = await OrganizationStudent.countDocuments({ studentId });
    if (otherOrgs === 0) {
      await User.findByIdAndDelete(studentId);
    }
    res.status(200).json({ success: true, message: "Student removed successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ success: false, message: "Failed to delete student", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const deleteAllStudents = async (req, res) => {
  try {
    const organizationId = req.user.userId;
    const orgStudents = await OrganizationStudent.find({ organizationId });
    const studentIds = orgStudents.map(os => os.studentId);
    await OrganizationStudent.deleteMany({ organizationId });
    for (const studentId of studentIds) {
      const otherOrgs = await OrganizationStudent.countDocuments({ studentId });
      if (otherOrgs === 0) {
        await User.findByIdAndDelete(studentId);
      }
    }
    res.status(200).json({ success: true, message: `All students removed successfully (${studentIds.length} students)` });
  } catch (error) {
    console.error("Delete all students error:", error);
    res.status(500).json({ success: false, message: "Failed to delete all students", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

const linkExistingStudentByEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const organizationId = req.user.userId;
    const { email } = req.body;
    const student = await User.findOne({ email, role: "student" });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found with this email" });
    }
    const existingLink = await OrganizationStudent.findOne({ organizationId, studentId: student._id });
    if (existingLink) {
      return res.status(409).json({ success: false, message: "Student is already linked to your organization" });
    }
    const orgStudent = new OrganizationStudent({ 
      organizationId, 
      studentId: student._id, 
      rollNumber: student.rollNumber || undefined, 
      course: student.course || undefined, 
      year: student.year || undefined, 
      status: "active" 
    });
    await orgStudent.save();
    res.status(200).json({ success: true, message: "Student linked successfully", data: { id: student._id, username: student.username, email: student.email, name: student.name } });
  } catch (error) {
    console.error("Link existing student error:", error);
    res.status(500).json({ success: false, message: "Failed to link student", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// Get all students for this organization
const getStudents = async (req, res) => {
  try {
    const organizationId = req.user.userId;

    const orgStudents = await OrganizationStudent.find({ organizationId, status: "active" })
      .populate('studentId')
      .sort({ createdAt: -1 })
      .lean();

    const students = orgStudents.map(os => {
      const student = os.studentId;
      if (!student) return null;
      return {
        id: student._id,
        username: student.username,
        email: student.email,
        name: student.name,
        rollNumber: student.rollNumber,
        course: student.course,
        year: student.year,
        joined_at: os.createdAt
      };
    }).filter(s => s !== null);

    res.status(200).json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = { submitRegistrationRequest, getDashboardData, getAnnouncements, createAnnouncement, getEvents, createEvent, registerForEvent, getPendingStudentEvents, reviewStudentEvent, addStudent, addStudentsBulk, deleteStudent, deleteAllStudents, linkExistingStudentByEmail, getStudents };

