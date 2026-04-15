const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkRole } = require('../middleware/auth');

router.get('/',    userController.getAllUsers);
router.get('/:id', userController.getUser);

// Only Admin can create staff accounts (Technician / Manager / Admin)
router.post('/', checkRole('Admin'), userController.createUser);

router.put('/:id',    checkRole('Admin'), userController.updateUser);
router.delete('/:id', checkRole('Admin'), userController.deleteUser);

module.exports = router;
