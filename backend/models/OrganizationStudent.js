const mongoose = require('mongoose');

const organizationStudentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNumber: {
    type: String,
    required: false,
    default: null
  },
  course: {
    type: String,
    required: false,
    default: null
  },
  year: {
    type: String,
    required: false,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated'],
    default: 'active'
  },
  joinedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Composite unique index to prevent duplicate org-student relationships
organizationStudentSchema.index({ organizationId: 1, studentId: 1 }, { unique: true });

// Indexes for faster queries
organizationStudentSchema.index({ organizationId: 1 });
organizationStudentSchema.index({ studentId: 1 });
organizationStudentSchema.index({ status: 1 });

module.exports = mongoose.model('OrganizationStudent', organizationStudentSchema);