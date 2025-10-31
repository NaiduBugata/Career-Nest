const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { submitRegistrationRequest } = require('../controllers/organizationController');

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

// Public organization registration endpoint (no auth required)
router.post('/register-request', registrationValidation, submitRegistrationRequest);

// Test endpoint to verify routing
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Public organization routes working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;