const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');

const {
  getCourses,
  createCourse,
  getCourseDetails,
  enrollInCourse,
  submitQuizAttempt,
  updateVideoProgress,
  updateCourse,
  deleteCourse
} = require('../controllers/coursesController');

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  console.log('🧪 Courses route test endpoint hit');
  res.json({ success: true, message: 'Courses routes are working' });
});

// Test authenticated endpoint
router.get('/test-auth', authMiddleware, (req, res) => {
  console.log('🔐 Authenticated test endpoint hit by user:', req.user);
  res.json({ 
    success: true, 
    message: 'Authenticated courses route working',
    user: { id: req.user.userId, role: req.user.role }
  });
});

// Add logging middleware
router.use((req, res, next) => {
  console.log(`📝 Courses route: ${req.method} ${req.originalUrl}`);
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  next();
});

// Course validation rules (for create)
const courseValidation = [
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('youtube_url')
    .isURL()
    .withMessage('Please provide a valid YouTube URL'),
  body('difficulty_level')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Difficulty level must be Beginner, Intermediate, or Advanced'),
  // Category and duration are required by the model but may be omitted by UI;
  // controller provides safe defaults, so keep them optional here
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('quiz_questions')
    .optional()
    .isArray()
    .withMessage('Quiz questions must be an array')
];

// Relaxed validation for updates (all fields optional but validated if present)
const updateCourseValidation = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('youtube_url')
    .optional()
    .isURL()
    .withMessage('Please provide a valid YouTube URL'),
  body('difficulty_level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Difficulty level must be Beginner, Intermediate, or Advanced'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('quiz_questions')
    .optional()
    .isArray()
    .withMessage('Quiz questions must be an array')
];

// Quiz submission validation
const quizValidation = [
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
  body('timeTakenSeconds')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time taken must be a positive integer')
];

// Video progress validation
const videoProgressValidation = [
  body('watchPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Watch percentage must be between 0 and 100'),
  body('watched')
    .optional()
    .isBoolean()
    .withMessage('Watched must be a boolean')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

// Course routes
router.get('/', getCourses); // GET /api/courses - Get all visible courses
router.post('/', courseValidation, createCourse); // POST /api/courses - Create new course
router.get('/:courseId', getCourseDetails); // GET /api/courses/:id - Get course details
router.post('/:courseId/enroll', enrollInCourse); // POST /api/courses/:id/enroll - Enroll in course
router.post('/:courseId/quiz', quizValidation, submitQuizAttempt); // POST /api/courses/:id/quiz - Submit quiz
router.post('/:courseId/progress', videoProgressValidation, updateVideoProgress); // POST /api/courses/:id/progress - Update video progress
router.put('/:courseId', updateCourseValidation, updateCourse); // PUT /api/courses/:id - Update course
router.delete('/:courseId', deleteCourse); // DELETE /api/courses/:id - Soft delete course

module.exports = router;