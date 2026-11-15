const Project = require('../models/Project');

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

module.exports = { createProject, listProjects };