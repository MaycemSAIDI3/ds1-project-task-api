const express = require('express');
const authenticate = require('../middleware/authenticate');
const controller = require('../controllers/taskController');
const router = express.Router({ mergeParams: true });

// El projet fel URL y7added el permission lel taches el kol.
router.use(authenticate, controller.loadProject);
router.post('/', controller.createTask);
router.get('/', controller.listTasks);
router.get('/:taskId', controller.loadTask, controller.getTask);

module.exports = router;
