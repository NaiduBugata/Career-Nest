const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hackathon', 'quiz', 'coding', 'workshop', 'seminar', 'conference', 'other']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  maxParticipants: {
    type: Number,
    required: true
  },
  requirements: {
    type: String,
    default: null
  },
  prizes: {
    type: String,
    default: null
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['student', 'organization', 'admin'],
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  eventCode: {
    type: String,
    unique: true,
    sparse: true  // Only unique when present (for private events)
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'  // Admin events are auto-approved
  },
  approvalFeedback: {
    type: String,
    default: null
  },
  registeredCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ title: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ organizationId: 1 });
eventSchema.index({ visibility: 1 });
eventSchema.index({ status: 1 });
// eventCode already has unique: true, so no need for separate index

module.exports = mongoose.model('Event', eventSchema);