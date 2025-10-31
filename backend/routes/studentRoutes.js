const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getStudentAnnouncements,
  getStudentEvents,
  getStudentRegisteredEvents,
  registerForEvent,
  getStudentDashboard,
  createStudentEvent,
  joinPrivateEvent,
  getStudentCreatedEvents,
  getStudentMembership
} = require('../controllers/studentController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Student dashboard overview
router.get('/dashboard', getStudentDashboard);

// Student announcements (from their organization)
router.get('/announcements', getStudentAnnouncements);

// Student membership information
router.get('/membership', getStudentMembership);

// Student events (from their organization)
router.get('/events', getStudentEvents);

// Student's registered events
router.get('/registered-events', getStudentRegisteredEvents);

// Student's created events
router.get('/created-events', getStudentCreatedEvents);

// Create a new event
router.post('/create-event', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('type').isIn(['hackathon', 'quiz', 'coding', 'workshop', 'seminar', 'conference']).withMessage('Invalid event type'),
  body('start_date').notEmpty().withMessage('Start date is required'),
  body('end_date').notEmpty().withMessage('End date is required'),
  body('venue').notEmpty().withMessage('Venue is required'),
  body('max_participants').isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
  body('registration_deadline').notEmpty().withMessage('Registration deadline is required'),
  body('visibility').isIn(['public', 'private']).withMessage('Visibility must be public or private')
], createStudentEvent);

// Join private event using code
router.post('/join-private-event', [
  body('eventCode')
    .isLength({ min: 6, max: 8 })
    .withMessage('Event code must be 6-8 characters')
], joinPrivateEvent);

// Register for an event
router.post('/register-event', [
  body('eventId')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a valid integer')
], registerForEvent);

module.exports = router;