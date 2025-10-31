const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['organization', 'admin'],
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  author: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
announcementSchema.index({ createdBy: 1 });
announcementSchema.index({ organizationId: 1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);