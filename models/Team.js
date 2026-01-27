const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  specialization: {
    type: String,
    enum: ['Mechanics', 'Electricians', 'IT Support', 'HVAC', 'Plumbing', 'General'],
    default: 'General'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for team member count
teamSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Ensure virtuals are included in JSON
teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Team', teamSchema);
