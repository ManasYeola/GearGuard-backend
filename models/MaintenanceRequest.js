const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true,
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  requestType: {
    type: String,
    required: [true, 'Request type is required'],
    enum: ['Corrective', 'Preventive'],
    default: 'Corrective'
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'Equipment is required']
  },
  // Auto-filled from equipment
  equipmentCategory: {
    type: String
  },
  maintenanceTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  duration: {
    type: Number, // Duration in hours
    min: 0
  },
  stage: {
    type: String,
    enum: ['New', 'In Progress', 'Repaired', 'Scrap'],
    default: 'New'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  // For tracking overdue status
  isOverdue: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate request number before saving
maintenanceRequestSchema.pre('save', async function(next) {
  if (!this.requestNumber) {
    const count = await mongoose.model('MaintenanceRequest').countDocuments();
    this.requestNumber = `REQ-${String(count + 1).padStart(5, '0')}`;
  }
  
  // Check if overdue (only for scheduled preventive maintenance)
  if (this.scheduledDate && this.stage !== 'Repaired' && this.stage !== 'Scrap') {
    this.isOverdue = new Date() > this.scheduledDate;
  }
  
  next();
});

// Index for efficient queries
maintenanceRequestSchema.index({ stage: 1, requestType: 1, scheduledDate: 1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
