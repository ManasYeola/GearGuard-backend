const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authorizeRole } = require('../middleware/jwt');

// Anyone authenticated can view equipment
router.get('/', equipmentController.getAllEquipment);
router.get('/grouped', equipmentController.getEquipmentGrouped);
router.get('/:id', equipmentController.getEquipment);
router.get('/:id/maintenance-requests', equipmentController.getEquipmentMaintenanceRequests);

// Only admins can create, update, delete equipment
router.post('/', authorizeRole('Admin'), equipmentController.createEquipment);
router.put('/:id', authorizeRole('Admin'), equipmentController.updateEquipment);
router.delete('/:id', authorizeRole('Admin'), equipmentController.deleteEquipment);

module.exports = router;
