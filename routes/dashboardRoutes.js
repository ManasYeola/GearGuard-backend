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

// Team performance breakdown — admin / manager
router.get('/team-performance', authorizeRole('Admin', 'Manager'), dashboardController.getTeamPerformance);

// Role-aware report (personal/team/global depending on role)
router.get('/report', authorizeRole('Admin', 'Manager', 'Technician', 'User'), dashboardController.getRoleBasedReport);
router.get('/report/export', authorizeRole('Admin', 'Manager'), dashboardController.exportRoleBasedReport);
router.get('/equipment-analysis', authorizeRole('Admin', 'Manager', 'Technician', 'User'), dashboardController.getEquipmentAnalysis);

module.exports = router;
