const mongoose = require('mongoose');

const courseEnrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completed: {
    type: Boolean,
    default: false
  },
  completionDate: {
    type: Date,
    default: null
  },
  quizScore: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Composite unique index to prevent duplicate enrollments
courseEnrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

// Indexes for faster queries
courseEnrollmentSchema.index({ studentId: 1 });
courseEnrollmentSchema.index({ courseId: 1 });
courseEnrollmentSchema.index({ completed: 1 });

module.exports = mongoose.model('CourseEnrollment', courseEnrollmentSchema);