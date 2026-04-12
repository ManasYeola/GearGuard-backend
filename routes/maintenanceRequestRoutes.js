const express = require('express');
const router = express.Router();
const maintenanceRequestController = require('../controllers/maintenanceRequestController');
const { authorizeRole } = require('../middleware/jwt');

// View routes - accessible to all authenticated users
router.get('/', maintenanceRequestController.getAllRequests);
router.get('/kanban', maintenanceRequestController.getKanbanView);
router.get('/calendar', maintenanceRequestController.getCalendarView);
router.get('/statistics', maintenanceRequestController.getStatistics);
router.get('/my-requests', maintenanceRequestController.getMyRequests);
router.get('/:id', maintenanceRequestController.getRequest);

// Create request - employees and admin can create
router.post('/', authorizeRole('User', 'Admin'), maintenanceRequestController.createRequest);

// Update request - admin and assigned technician
router.put('/:id', maintenanceRequestController.updateRequest);

// Technician workflow
router.patch('/:id/start-work', authorizeRole('Technician', 'Admin'), maintenanceRequestController.startWork);
router.patch('/:id/complete', authorizeRole('Technician', 'Admin'), maintenanceRequestController.completeRequest);
router.patch('/:id/add-notes', authorizeRole('Technician', 'Admin'), maintenanceRequestController.addWorkNotes);
router.patch('/:id/stage', maintenanceRequestController.updateStage);

// Admin workflow
router.patch('/:id/assign-technician', authorizeRole('Admin'), maintenanceRequestController.assignTechnician);

// Employee feedback
router.patch('/:id/rate', authorizeRole('User', 'Admin'), maintenanceRequestController.rateService);

// Delete request - admin only
router.delete('/:id', authorizeRole('Admin'), maintenanceRequestController.deleteRequest);

module.exports = router;
