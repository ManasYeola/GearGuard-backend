const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const ctrl = require('../controllers/maintenanceRequestController');

// ── Static / named routes MUST come before /:id ───────────────────────────────
router.get('/',             ctrl.getAllRequests);
router.get('/kanban',       ctrl.getKanbanView);
router.get('/calendar',     ctrl.getCalendarView);
router.get('/statistics',   ctrl.getStatistics);
router.get('/my-requests',  ctrl.getMyRequests);   // ← Issue 7 fix

// ── Parameterised routes ───────────────────────────────────────────────────────
router.get('/:id',          ctrl.getRequest);
router.post('/',            ctrl.createRequest);
router.put('/:id',          ctrl.updateRequest);
router.delete('/:id',       ctrl.deleteRequest);

// ── Stage / workflow PATCH routes (Issue 8) ────────────────────────────────────
router.patch('/:id/stage',             ctrl.updateStage);
router.patch('/:id/assign-technician', ctrl.assignTechnician);
router.patch('/:id/start-work',        ctrl.startWork);
router.patch('/:id/add-notes',         ctrl.addNotes);
router.patch('/:id/complete',          ctrl.completeRequest);
router.patch('/:id/rate',              ctrl.rateService);
=======
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
router.patch('/:id/stage', authorizeRole('Technician', 'Manager', 'Admin'), maintenanceRequestController.updateStage);

// Admin workflow
router.patch('/:id/assign-technician', authorizeRole('Admin'), maintenanceRequestController.assignTechnician);

// Employee feedback
router.patch('/:id/verify', authorizeRole('User', 'Admin'), maintenanceRequestController.verifyRequest);
router.patch('/:id/rate', authorizeRole('User', 'Admin'), maintenanceRequestController.rateService);

// Delete request - admin only
router.delete('/:id', authorizeRole('Admin'), maintenanceRequestController.deleteRequest);
>>>>>>> 59e99faba3db0079e7c4859002caa138441b8545

module.exports = router;
