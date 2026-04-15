const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, checkRole } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(protect);

// Admin / Manager overview
router.get('/admin',
  checkRole('Admin', 'Manager'),
  dashboardController.getAdminDashboard
);

// Technician task summary
router.get('/technician',
  checkRole('Admin', 'Manager', 'Technician'),
  dashboardController.getTechnicianDashboard
);

// Employee (User) — requests they submitted
router.get('/employee',
  checkRole('Admin', 'Manager', 'Technician', 'User'),
  dashboardController.getEmployeeDashboard
);

// Team performance breakdown — admin / manager
router.get('/team-performance',
  checkRole('Admin', 'Manager'),
  dashboardController.getTeamPerformance
);

module.exports = router;
