const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
<<<<<<< HEAD
const { authorizeRole } = require('../middleware/jwt');

// Admin dashboard
router.get('/admin', authorizeRole('Admin'), dashboardController.getAdminDashboard);

// Technician dashboard
router.get('/technician', authorizeRole('Technician'), dashboardController.getTechnicianDashboard);

// Employee dashboard
router.get('/employee', authorizeRole('User'), dashboardController.getEmployeeDashboard);

// Team performance (accessible to admin and technicians)
router.get('/team-performance', authorizeRole('Admin', 'Technician'), dashboardController.getTeamPerformance);
=======
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
>>>>>>> a32c162 (Changes applied)

module.exports = router;
