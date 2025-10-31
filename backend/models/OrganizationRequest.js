const mongoose = require('mongoose');

const organizationRequestSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewDate: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  // Auto-generated credentials when approved
  username: {
    type: String,
    default: null
  },
  generatedPassword: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
organizationRequestSchema.index({ email: 1 });
organizationRequestSchema.index({ status: 1 });
organizationRequestSchema.index({ requestDate: -1 });

const OrganizationRequest = mongoose.model('OrganizationRequest', organizationRequestSchema);

module.exports = OrganizationRequest;
