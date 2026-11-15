const Task = require('../models/Task');
const Project = require('../models/Project');

// Nthabtou permission el projet 9bal ay operation 3al taches.
async function loadProject(req, res, next) {
  const { projectId } = req.params;
  if (!/^[a-fA-F0-9]{24}$/.test(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID.' });
  }
  try {
    const filter = { _id: projectId };
    if (req.user.role !== 'manager') filter.owner = req.user._id;
    req.project = await Project.findOne(filter);
    if (!req.project) return res.status(404).json({ message: 'Project not found.' });
    return next();
  } catch (error) { return next(error); }
}

// Na9blou ken champs el tache, bla project wala createdAt.
function validateTask(body, creating = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'A JSON object is required.';
  const allowed = ['title', 'description', 'status', 'deadline'];
  if (!Object.keys(body).length || Object.keys(body).some(key => !allowed.includes(key))) return 'Provide only title, description, status, or deadline.';
  if ((creating || Object.hasOwn(body, 'title')) && (typeof body.title !== 'string' || !body.title.trim())) return 'Title must be a non-empty string.';
  if (Object.hasOwn(body, 'description') && typeof body.description !== 'string') return 'Description must be a string.';
  if (Object.hasOwn(body, 'status') && !['todo', 'doing', 'done'].includes(body.status)) return 'Status must be todo, doing, or done.';
  if (Object.hasOwn(body, 'deadline') && body.deadline !== null && (typeof body.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(body.deadline) || !Number.isFinite(Date.parse(body.deadline)))) return 'Deadline must be a valid ISO date string or null.';
  return null;
}

// Nraj3ou erreurs validation bla details techniques.
function taskError(error, res, next) {
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Invalid task data.', errors: Object.values(error.errors).map(item => item.message) });
  return next(error);
}

async function createTask(req, res, next) {
  const invalid = validateTask(req.body, true);
  if (invalid) return res.status(400).json({ message: invalid });
  try {
    const { title, description, status, deadline } = req.body;
    const task = await Task.create({ title, description, status, deadline, project: req.project._id });
    return res.status(201).json({ message: 'Task created successfully.', task });
  } catch (error) { return taskError(error, res, next); }
}

async function listTasks(req, res, next) {
  try {
    const tasks = await Task.find({ project: req.project._id }).sort({ createdAt: -1, _id: -1 });
    return res.status(200).json({ count: tasks.length, tasks });
  } catch (error) { return next(error); }
}

// El ID tache lezem ykoun s7i7 w marbout bel projet fel URL.
async function loadTask(req, res, next) {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.taskId)) return res.status(400).json({ message: 'Invalid task ID.' });
  try {
    req.task = await Task.findOne({ _id: req.params.taskId, project: req.project._id });
    if (!req.task) return res.status(404).json({ message: 'Task not found.' });
    return next();
  } catch (error) { return next(error); }
}

function getTask(req, res) { return res.status(200).json({ task: req.task }); }

module.exports = { loadProject, loadTask, createTask, listTasks, getTask, validateTask, taskError };
