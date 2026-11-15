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

module.exports = { createProject };