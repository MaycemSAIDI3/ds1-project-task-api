const Project = require('../models/Project');
const Task = require('../models/Task');

// Kol user connecte ynajjem yasna3 projet.
async function createProject(req, res, next) {
  const { name, description, status } = req.body || {};

  // El nom obligatoire w lezem ykoun texte.
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      message: 'Project name is required as a non-empty string.',
    });
  }

  // El description facultative, ama ken mawjoudha lezem texte.
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({
      message: 'Description must be a string.',
    });
  }

  // Na9blou ken el statuts elli mawjoudin fel model.
  const allowedStatuses = ['in_progress', 'completed', 'paused'];

  if (status !== undefined && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Status must be in_progress, completed, or paused.',
    });
  }

  try {
    // El owner ne5dhouh mel user connecte, moch mel requete.
    // Ma ne5dhou ken el champs elli na9blouhom.
    const project = await Project.create({
      name,
      description,
      status,
      owner: req.user._id,
    });

    return res.status(201).json({
      message: 'Project created successfully.',
      project,
    });
  } catch (error) {
    // El model ythabet zeda mel longueur mta3 el textes.
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid project data.',
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    return next(error);
  }
}

// Na9raw el projets selon el role, recherche w tri.
async function listProjects(req, res, next) {
  const {
    search = '',
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  // Ma na9blouch tableaux wala objets fel recherche.
  if (typeof search !== 'string' || search.length > 200) {
    return res.status(400).json({
      message: 'Search must be a string of at most 200 characters.',
    });
  }

  // Na9blou ken el champs hedhouma lel tri.
  const allowedSortFields = ['name', 'status', 'createdAt'];

  if (!allowedSortFields.includes(sortBy)) {
    return res.status(400).json({
      message: 'Sort field must be name, status, or createdAt.',
    });
  }

  if (!['asc', 'desc'].includes(order)) {
    return res.status(400).json({
      message: 'Order must be asc or desc.',
    });
  }

  // El manager ychouf el kol.
  // El user ychouf ken el projets elli howa sa7ebhom.
  const filter =
    req.user.role === 'manager'
      ? {}
      : { owner: req.user._id };

  const searchText = search.trim();

  if (searchText) {
    // N7awlou caracteres regex l texte 3adi.
    // Hakka el recherche tet3amel m3a texte el user kif ma houwa.
    const escapedSearch = searchText.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  try {
    const direction = order === 'asc' ? 1 : -1;

    // Nzidou _id bech el ordre yab9a stable ki valeurs kifkif.
    const projects = await Project.find(filter).sort({
      [sortBy]: direction,
      _id: direction,
    });

    return res.status(200).json({
      count: projects.length,
      projects,
    });
  } catch (error) {
    return next(error);
  }
}

// Na9raw projet wa7dou selon el ID mte3ou.
async function getProject(req, res, next) {
  const { id } = req.params;

  // Netthabtou mel format 9bal requete MongoDB.
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({
      message: 'Invalid project ID.',
    });
  }

  try {
    // El user ylawwej ken fel projets mte3ou.
    // El manager ynajjem ylawwej fel projets el kol.
    const filter = { _id: id };

    if (req.user.role !== 'manager') {
      filter.owner = req.user._id;
    }

    const project = await Project.findOne(filter);

    // Nraj3ou 404 zeda ki projet mta3 user e5er.
    // Hakka ma nkachfouch elli el projet mawjoud.
    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    return res.status(200).json({
      project,
    });
  } catch (error) {
    return next(error);
  }
}

// Nbaddlou projet ken el user sa7bou wala manager.
async function updateProject(req, res, next) {
  const { id } = req.params;

  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({
      message: 'Invalid project ID.',
    });
  }

  const body = req.body;

  // Lezem el contenu ykoun objet JSON.
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      message: 'A JSON object is required.',
    });
  }

  const allowedFields = ['name', 'description', 'status'];
  const fields = Object.keys(body);

  // Ma na9blouch owner wala champs o5rin.
  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.includes(field))
  ) {
    return res.status(400).json({
      message: 'Provide only name, description, or status.',
    });
  }

  if (
    Object.hasOwn(body, 'name') &&
    (typeof body.name !== 'string' || !body.name.trim())
  ) {
    return res.status(400).json({
      message: 'Name must be a non-empty string.',
    });
  }

  if (
    Object.hasOwn(body, 'description') &&
    typeof body.description !== 'string'
  ) {
    return res.status(400).json({
      message: 'Description must be a string.',
    });
  }

  if (
    Object.hasOwn(body, 'status') &&
    !['in_progress', 'completed', 'paused'].includes(body.status)
  ) {
    return res.status(400).json({
      message: 'Status must be in_progress, completed, or paused.',
    });
  }

  try {
    // N7ottou permission fel filtre mta3 recherche.
    const filter = { _id: id };

    if (req.user.role !== 'manager') {
      filter.owner = req.user._id;
    }

    const project = await Project.findOne(filter);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    // Nbaddlou ken el champs el masmou7in.
    for (const field of fields) {
      project[field] = body[field];
    }

    // save ychaghel validations mta3 el model.
    await project.save();

    return res.status(200).json({
      message: 'Project updated successfully.',
      project,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid project data.',
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    return next(error);
  }
}

// Nfas5ou projet ken el user sa7bou wala manager.
async function deleteProject(req, res, next) {
  const { id } = req.params;

  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({
      message: 'Invalid project ID.',
    });
  }

  try {
    // El permission tetthabet 9bal ay suppression.
    const filter = { _id: id };

    if (req.user.role !== 'manager') {
      filter.owner = req.user._id;
    }

    const project = await Project.findOne(filter);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    // Nfas5ou el taches elli marboutin bel projet.
    const deletedTasks = await Task.deleteMany({
      project: project._id,
    });

    // Ba3d nfas5ou el projet.
    await project.deleteOne();

    return res.status(200).json({
      message: 'Project deleted successfully.',
      deletedTasks: deletedTasks.deletedCount,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
};