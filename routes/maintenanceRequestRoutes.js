const express = require('express');
const router = express.Router();
const maintenanceRequestController = require('../controllers/maintenanceRequestController');

router.get('/', maintenanceRequestController.getAllRequests);
router.get('/kanban', maintenanceRequestController.getKanbanView);
router.get('/calendar', maintenanceRequestController.getCalendarView);
router.get('/statistics', maintenanceRequestController.getStatistics);
router.get('/:id', maintenanceRequestController.getRequest);
router.post('/', maintenanceRequestController.createRequest);
router.put('/:id', maintenanceRequestController.updateRequest);
router.patch('/:id/stage', maintenanceRequestController.updateStage);
router.delete('/:id', maintenanceRequestController.deleteRequest);

module.exports = router;
