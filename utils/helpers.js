// Utility functions for GearGuard

/**
 * Format date to readable string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate days until scheduled date
 */
const daysUntilScheduled = (scheduledDate) => {
  const today = new Date();
  const scheduled = new Date(scheduledDate);
  const diffTime = scheduled - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if request is overdue
 */
const isOverdue = (scheduledDate, stage) => {
  if (stage === 'Repaired' || stage === 'Scrap') return false;
  const today = new Date();
  const scheduled = new Date(scheduledDate);
  return today > scheduled;
};

/**
 * Calculate equipment age in years
 */
const calculateEquipmentAge = (purchaseDate) => {
  const today = new Date();
  const purchase = new Date(purchaseDate);
  const diffTime = today - purchase;
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
  return Math.floor(diffYears * 10) / 10; // Round to 1 decimal
};

/**
 * Check if warranty is still valid
 */
const isWarrantyValid = (warrantyExpiry) => {
  if (!warrantyExpiry) return false;
  const today = new Date();
  const expiry = new Date(warrantyExpiry);
  return today < expiry;
};

/**
 * Generate request number
 */
const generateRequestNumber = (count) => {
  return `REQ-${String(count + 1).padStart(5, '0')}`;
};

/**
 * Format duration (hours) to human readable
 */
const formatDuration = (hours) => {
  if (!hours) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
};

/**
 * Get priority badge color
 */
const getPriorityColor = (priority) => {
  const colors = {
    Low: '#10b981',
    Medium: '#f59e0b',
    High: '#ef4444',
    Critical: '#dc2626'
  };
  return colors[priority] || '#6b7280';
};

/**
 * Get stage badge color
 */
const getStageColor = (stage) => {
  const colors = {
    New: '#3b82f6',
    'In Progress': '#f59e0b',
    Repaired: '#10b981',
    Scrap: '#ef4444'
  };
  return colors[stage] || '#6b7280';
};

/**
 * Validate serial number format
 */
const validateSerialNumber = (serialNumber) => {
  // Simple validation: alphanumeric with dashes/underscores
  const pattern = /^[A-Z0-9-_]+$/i;
  return pattern.test(serialNumber);
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
};

module.exports = {
  formatDate,
  daysUntilScheduled,
  isOverdue,
  calculateEquipmentAge,
  isWarrantyValid,
  generateRequestNumber,
  formatDuration,
  getPriorityColor,
  getStageColor,
  validateSerialNumber,
  sanitizeString
};
