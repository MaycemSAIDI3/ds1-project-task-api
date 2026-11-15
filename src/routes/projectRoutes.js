const express = require('express');
const authenticate = require('../middleware/authenticate');
const {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const router = express.Router();

// El routes el kol tetlob utilisateur connecte.
router.use(authenticate);

// Creation projet lel user w manager.
router.post('/', createProject);

// Liste projets m3a recherche w tri.
router.get('/', listProjects);

// Consultation projet wa7dou bel ID.
router.get('/:id', getProject);
// Modification partielle mta3 projet.
router.patch('/:id', updateProject);
// Suppression projet w el taches mte3ou.
router.delete('/:id', deleteProject);

module.exports = router;