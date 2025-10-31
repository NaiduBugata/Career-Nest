const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  category: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  videoUrl: {
    type: String,
    default: null
  },
  materials: {
    type: String,
    default: null
  },
  quizData: {
    type: mongoose.Schema.Types.Mixed,  // Stores quiz as JSON
    default: null
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
courseSchema.index({ title: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ createdBy: 1 });
courseSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Course', courseSchema);