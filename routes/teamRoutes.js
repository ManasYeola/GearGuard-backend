const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeam);
router.post('/', teamController.createTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);
router.post('/:id/members', teamController.addMember);
router.delete('/:id/members', teamController.removeMember);

module.exports = router;
