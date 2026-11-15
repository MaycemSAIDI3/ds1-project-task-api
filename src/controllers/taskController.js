const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

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
  const allowed = ['title', 'description', 'status', 'deadline', 'assignedTo'];
  if (!Object.keys(body).length || Object.keys(body).some(key => !allowed.includes(key))) return 'Provide only title, description, status, deadline, or assignedTo.';
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
    if (!(await validateAssignment(req, res))) return;
    const { title, description, status, deadline, assignedTo } = req.body;
    const task = await Task.create({ title, description, status, deadline, assignedTo, project: req.project._id });
    return res.status(201).json({ message: 'Task created successfully.', task });
  } catch (error) { return taskError(error, res, next); }
}

async function listTasks(req, res, next) {
  const { search = '', sortBy = 'createdAt', order = 'desc', status } = req.query;
  if (typeof search !== 'string' || search.length > 200) return res.status(400).json({ message: 'Search must be a string of at most 200 characters.' });
  if (!['title', 'status', 'deadline', 'createdAt'].includes(sortBy) || !['asc', 'desc'].includes(order)) return res.status(400).json({ message: 'Invalid task sort field or order.' });
  if (status !== undefined && !['todo', 'doing', 'done'].includes(status)) return res.status(400).json({ message: 'Invalid task status filter.' });
  const filter = { project: req.project._id };
  if (status !== undefined) filter.status = status;
  if (search.trim()) {
    // El recherche texte ma tetfassarch k regex mel user.
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ title: { $regex: escaped, $options: 'i' } }, { description: { $regex: escaped, $options: 'i' } }];
  }
  try {
    const direction = order === 'asc' ? 1 : -1;
    const tasks = await Task.find(filter).sort({ [sortBy]: direction, _id: direction });
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

// Nbaddlou ken champs masmou7in, bla ma nna9lou el tache.
async function updateTask(req, res, next) {
  const invalid = validateTask(req.body);
  if (invalid) return res.status(400).json({ message: invalid });
  try {
    if (!(await validateAssignment(req, res))) return;
    for (const key of Object.keys(req.body)) req.task[key] = req.body[key];
    await req.task.save();
    return res.status(200).json({ message: 'Task updated successfully.', task: req.task });
  } catch (error) { return taskError(error, res, next); }
}

// Ken el manager ynajjem yaffecti wala yna77i affectation.
async function validateAssignment(req, res) {
  if (!Object.hasOwn(req.body, 'assignedTo')) return true;
  if (req.user.role !== 'manager') {
    res.status(403).json({ message: 'Only a manager can assign tasks.' });
    return false;
  }
  const id = req.body.assignedTo;
  if (id === null) return true;
  if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) {
    res.status(400).json({ message: 'Assigned user ID must be valid or null.' });
    return false;
  }
  if (!(await User.exists({ _id: id }))) {
    res.status(404).json({ message: 'Assigned user not found.' });
    return false;
  }
  return true;
}

async function deleteTask(req, res, next) {
  try {
    await req.task.deleteOne();
    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) { return next(error); }
}

module.exports = { loadProject, loadTask, createTask, listTasks, getTask, updateTask, deleteTask, validateTask, taskError };
