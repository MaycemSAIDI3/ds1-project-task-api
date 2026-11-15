const express = require('express');
const path = require('node:path');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Nasna3ou el application Express.
const app = express();

// Na9raw el donnees JSON mel requetes.
app.use(express.json({ limit: '100kb' }));

// Nesta3mlou ken public lel interface, moch dossier el projet.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route bech netthabtou elli el API te5dem.
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    message: 'API is running.',
  });
});

// Kol route fel authRoutes tabda b /api/auth.
app.use('/api/auth', authRoutes);
// Norbtou el routes mta3 projets bel adresse /api/projects.
app.use('/api/projects', projectRoutes);
// El taches dima marboutin b projet mawjoud.
app.use('/api/projects/:projectId/tasks', taskRoutes);

// Nraj3ou 404 ki el route ma famech.
app.use((req, res) => {
  return res.status(404).json({
    message: 'Route not found.',
  });
});

// El gestionnaire mta3 erreurs yji ba3d el routes.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Invalid JSON body.',
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Request body is too large.',
    });
  }

  // Details el erreur yab9aw fel terminal.
  console.error(error);

  return res.status(500).json({
    message: 'Internal server error.',
  });
});

module.exports = app;
