const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authorizeRole } = require('../middleware/jwt');

// Only admins can manage users
router.get('/', authorizeRole('Admin'), userController.getAllUsers);
router.get('/:id', authorizeRole('Admin'), userController.getUser);
router.post('/', authorizeRole('Admin'), userController.createUser);
router.put('/:id', authorizeRole('Admin'), userController.updateUser);
router.delete('/:id', authorizeRole('Admin'), userController.deleteUser);

module.exports = router;
