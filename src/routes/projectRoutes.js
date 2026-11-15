const express = require('express');
const authenticate = require('../middleware/authenticate');
const {
  createProject,
  listProjects,
} = require('../controllers/projectController');

const router = express.Router();

// El routes el kol tetlob utilisateur connecte.
router.use(authenticate);

// Creation projet lel user w manager.
router.post('/', createProject);

// Liste projets m3a recherche w tri.
router.get('/', listProjects);

module.exports = router;