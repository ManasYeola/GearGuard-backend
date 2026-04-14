const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
<<<<<<< HEAD
const { authorizeRole } = require('../middleware/jwt');

// Only admins can manage users
router.get('/', authorizeRole('Admin'), userController.getAllUsers);
router.get('/:id', authorizeRole('Admin'), userController.getUser);
router.post('/', authorizeRole('Admin'), userController.createUser);
router.put('/:id', authorizeRole('Admin'), userController.updateUser);
router.delete('/:id', authorizeRole('Admin'), userController.deleteUser);
=======
const { checkRole } = require('../middleware/auth');

router.get('/',    userController.getAllUsers);
router.get('/:id', userController.getUser);

// Only Admin can create staff accounts (Technician / Manager / Admin)
router.post('/', checkRole('Admin'), userController.createUser);

router.put('/:id',    checkRole('Admin'), userController.updateUser);
router.delete('/:id', checkRole('Admin'), userController.deleteUser);
>>>>>>> a32c162 (Changes applied)

module.exports = router;
