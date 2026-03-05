/**
 * EXAMPLE: How to Apply Role-Based Middleware to Routes
 * 
 * This file shows how to protect your routes with role-based authorization.
 * Copy these patterns to your actual route files.
 */

const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { isAdmin, isManager, isTechnician, isAuthenticated } = require('../middleware/auth');

// ============================================
// EQUIPMENT ROUTES - EXAMPLE WITH MIDDLEWARE
// ============================================

// GET all equipment - Technicians and above can view
router.get('/', isTechnician, equipmentController.getAllEquipment);

// GET grouped equipment - Technicians and above
router.get('/grouped', isTechnician, equipmentController.getEquipmentGrouped);

// GET single equipment - Technicians and above can view
router.get('/:id', isTechnician, equipmentController.getEquipment);

// GET equipment maintenance requests - Technicians and above
router.get('/:id/maintenance-requests', isTechnician, equipmentController.getEquipmentMaintenanceRequests);

// POST create equipment - Only Managers and Admins can create
router.post('/', isManager, equipmentController.createEquipment);

// PUT update equipment - Only Managers and Admins can update
router.put('/:id', isManager, equipmentController.updateEquipment);

// DELETE equipment - Only Admins can delete
router.delete('/:id', isAdmin, equipmentController.deleteEquipment);

// ============================================
// MAINTENANCE REQUEST ROUTES EXAMPLE
// ============================================

const maintenanceRequestController = require('../controllers/maintenanceRequestController');

// Anyone authenticated can view their requests
router.get('/requests', isAuthenticated, maintenanceRequestController.getAllRequests);

// Anyone authenticated can create a request
router.post('/requests', isAuthenticated, maintenanceRequestController.createRequest);

// Only managers can assign technicians
router.put('/requests/:id/assign', isManager, maintenanceRequestController.assignTechnician);

// Technicians and above can update status
router.put('/requests/:id/status', isTechnician, maintenanceRequestController.updateStatus);

// Only admins can delete requests
router.delete('/requests/:id', isAdmin, maintenanceRequestController.deleteRequest);

// ============================================
// TEAM ROUTES EXAMPLE
// ============================================

const teamController = require('../controllers/teamController');

// Only managers and admins can manage teams
router.get('/teams', isManager, teamController.getAllTeams);
router.post('/teams', isManager, teamController.createTeam);
router.put('/teams/:id', isManager, teamController.updateTeam);
router.delete('/teams/:id', isAdmin, teamController.deleteTeam);

// ============================================
// USER ROUTES EXAMPLE
// ============================================

const userController = require('../controllers/userController');

// Only admins can view all users
router.get('/users', isAdmin, userController.getAllUsers);

// Only admins can update user roles
router.put('/users/:id/role', isAdmin, userController.updateUserRole);

// Any authenticated user can view their own profile
router.get('/users/me', isAuthenticated, userController.getCurrentUser);

// Any authenticated user can update their own profile
router.put('/users/me', isAuthenticated, userController.updateCurrentUser);

module.exports = router;

/*
 * TO APPLY TO YOUR ACTUAL ROUTES:
 * 
 * 1. Import the middleware at the top of each route file:
 *    const { isAdmin, isManager, isTechnician, isAuthenticated } = require('../middleware/auth');
 * 
 * 2. Add middleware as the second parameter to routes:
 *    router.get('/path', middlewareFunction, controllerFunction);
 * 
 * 3. Choose appropriate middleware based on access level:
 *    - isAdmin: Only administrators
 *    - isManager: Managers and admins
 *    - isTechnician: Technicians, managers, and admins
 *    - isAuthenticated: Any logged-in user
 * 
 * 4. Remember to pass userId in requests:
 *    - In POST/PUT: req.body.userId
 *    - In GET/DELETE: req.query.userId or req.params.userId
 */
