const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  // Allow up to 10MB for bulk uploads
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Accept common CSV and Excel mime types and also validate by extension
    const mime = (file.mimetype || '').toLowerCase();
    const name = (file.originalname || '').toLowerCase();
    const isCsvMime = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel', 'text/x-csv'].includes(mime);
    const isExcelMime = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(mime);
    const hasValidExt = name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls');
    if (hasValidExt || isCsvMime || isExcelMime) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV (.csv) and Excel (.xlsx, .xls) files are allowed'));
    }
  }
});
const {
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
  linkExistingStudentByEmail,
  getStudents
} = require('../controllers/organizationController');

// Validation rules for registration request
const registrationValidation = [
  body('organization_name')
    .isLength({ min: 2, max: 255 })
    .withMessage('Organization name must be between 2 and 255 characters'),
  body('contact_person')
    .isLength({ min: 2, max: 255 })
    .withMessage('Contact person name must be between 2 and 255 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters')
];

// Validation rules
const announcementValidation = [
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('content')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('priority')
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, normal, high, urgent')
];

const eventValidation = [
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('type')
    .isIn(['hackathon', 'quiz', 'coding', 'workshop', 'seminar', 'conference'])
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
];

// Apply auth middleware to all routes
router.use(authMiddleware);

// Dashboard routes
router.get('/dashboard', getDashboardData);

// Student routes
router.get('/students', getStudents);

// Announcement routes
router.get('/announcements', getAnnouncements);
router.post('/announcements', announcementValidation, createAnnouncement);

// Event routes
router.get('/events', getEvents);
router.post('/events', eventValidation, createEvent);

// Event registration (for students)
router.post('/register-event', [
  body('eventId')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a valid integer')
], registerForEvent);

// Student event approval routes
router.get('/pending-student-events', getPendingStudentEvents);
router.post('/review-student-event', [
  body('eventId')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a valid integer'),
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either approve or reject')
], reviewStudentEvent);

// Student management routes
router.post('/add-student', [
  body('name')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('rollNumber')
    .notEmpty()
    .withMessage('Roll number is required'),
  body('course')
    .notEmpty()
    .withMessage('Course is required'),
  body('year')
    .notEmpty()
    .withMessage('Year is required')
], addStudent);

router.post('/add-students-bulk', upload.single('file'), addStudentsBulk);

// Link an existing student account (by email) to this organization
router.post('/link-existing-student-by-email', [
  body('email').isEmail().withMessage('Valid email is required')
], linkExistingStudentByEmail);

router.delete('/delete-student/:studentId', deleteStudent);

router.delete('/delete-all-students', deleteAllStudents);

module.exports = router;