const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Machinery', 'Vehicles', 'Computers', 'Tools', 'HVAC', 'Other'],
    default: 'Other'
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  warrantyExpiry: {
    type: Date
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  // Ownership - Department or Employee
  ownershipType: {
    type: String,
    enum: ['Department', 'Employee'],
    required: true
  },
  department: {
    type: String,
    trim: true
  },
  assignedEmployee: {
    name: String,
    email: String
  },
  // Default maintenance team
  maintenanceTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Maintenance team is required']
  },
  defaultTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Active', 'Under Maintenance', 'Scrapped', 'Retired'],
    default: 'Active'
  },
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for searching
equipmentSchema.index({ name: 1, serialNumber: 1, category: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
