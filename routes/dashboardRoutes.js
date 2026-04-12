const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authorizeRole } = require('../middleware/jwt');

// Admin dashboard
router.get('/admin', authorizeRole('Admin'), dashboardController.getAdminDashboard);

// Technician dashboard
router.get('/technician', authorizeRole('Technician'), dashboardController.getTechnicianDashboard);

// Employee dashboard
router.get('/employee', authorizeRole('User'), dashboardController.getEmployeeDashboard);

// Team performance (accessible to admin and technicians)
router.get('/team-performance', authorizeRole('Admin', 'Technician'), dashboardController.getTeamPerformance);

module.exports = router;
