const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Organization management
router.get('/organizations', getAllOrganizations);
router.get('/pending-organizations', getPendingOrganizations);

// Organization approval
router.post('/approve-organization', [
  body('requestId')
    .notEmpty()
    .withMessage('Valid request ID is required')
], approveOrganization);

router.post('/reject-organization', [
  body('requestId')
    .notEmpty()
    .withMessage('Valid request ID is required'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must not exceed 500 characters')
], rejectOrganization);

// Admin event creation
router.post('/events', [
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('type')
    .isIn(['hackathon', 'quiz', 'coding', 'workshop', 'seminar', 'conference', 'competition', 'webinar'])
    .withMessage('Invalid event type'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('venue')
    .isLength({ min: 3, max: 255 })
    .withMessage('Venue must be between 3 and 255 characters'),
  body('maxParticipants')
    .isInt({ min: 1 })
    .withMessage('Max participants must be a positive integer'),
  body('registrationDeadline')
    .isISO8601()
    .withMessage('Registration deadline must be a valid date')
], createAdminEvent);

// View all data
router.get('/events', getAllEvents);
router.get('/students', getAllStudents);

// Organization details and management
router.get('/organizations/:organizationId', getOrganizationDetails);
router.put('/organizations/:organizationId', [
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone must not exceed 20 characters')
], updateOrganizationDetails);

// User details and management
router.get('/users/:userId', getUserDetails);

// Password management
router.put('/users/:userId/password', [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], changeUserPassword);

// User status management
router.put('/users/:userId/toggle-status', toggleUserStatus);

module.exports = router;