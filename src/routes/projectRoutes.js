const express = require('express');
const authenticate = require('../middleware/authenticate');
const { createProject } = require('../controllers/projectController');

const router = express.Router();

// Kol route fel router hedha tetlob utilisateur connecte.
router.use(authenticate);

// User w manager ynajmou yasna3ou projet.
router.post('/', createProject);

module.exports = router;