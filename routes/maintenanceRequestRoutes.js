const express = require('express');
const router = express.Router();
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

module.exports = router;
