const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authorizeRole } = require('../middleware/jwt');

// Admin / Manager overview
router.get('/admin', authorizeRole('Admin', 'Manager'), dashboardController.getAdminDashboard);

// Technician task summary
router.get('/technician', authorizeRole('Admin', 'Manager', 'Technician'), dashboardController.getTechnicianDashboard);

// Employee (User) — requests they submitted
router.get('/employee', authorizeRole('Admin', 'Manager', 'Technician', 'User'), dashboardController.getEmployeeDashboard);

<<<<<<< HEAD
// Team performance (accessible to admin and technicians)
router.get('/team-performance', authorizeRole('Admin', 'Technician'), dashboardController.getTeamPerformance);
=======
// Team performance breakdown — admin / manager
router.get('/team-performance', authorizeRole('Admin', 'Manager'), dashboardController.getTeamPerformance);

// Role-aware report (personal/team/global depending on role)
router.get('/report', authorizeRole('Admin', 'Manager', 'Technician', 'User'), dashboardController.getRoleBasedReport);
router.get('/report/export', authorizeRole('Admin', 'Manager'), dashboardController.exportRoleBasedReport);
router.get('/equipment-analysis', authorizeRole('Admin', 'Manager', 'Technician', 'User'), dashboardController.getEquipmentAnalysis);
>>>>>>> ecd870dda7192b8c064908dfab3f0b487fd8d5f2

module.exports = router;
