const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'organization', 'admin']
  },
  phone: {
    type: String,
    default: null
  },
  // Student-specific fields
  rollNumber: {
    type: String,
    sparse: true  // Allows null but enforces uniqueness when present
  },
  course: {
    type: String,
    default: null
  },
  year: {
    type: String,
    default: null
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  organizationName: {
    type: String,
    default: null
  },
  // Metadata
  usernameChanged: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

// Additional indexes for faster queries (email and username already have unique indexes)
userSchema.index({ role: 1 });
userSchema.index({ organizationId: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);