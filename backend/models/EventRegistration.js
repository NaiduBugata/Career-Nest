const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'cancelled'],
    default: 'registered'
  }
}, {
  timestamps: true
});

// Composite unique index to prevent duplicate registrations
eventRegistrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

// Indexes for faster queries
eventRegistrationSchema.index({ studentId: 1 });
eventRegistrationSchema.index({ eventId: 1 });
eventRegistrationSchema.index({ status: 1 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);