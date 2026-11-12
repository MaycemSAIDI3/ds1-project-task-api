const mongoose = require('mongoose');

// El schema yfassar chnowa fih kol projet.
// Mongoose yesta3mlou bech yetthabet mel donnees 9bal el sauvegarde.
const projectSchema = new mongoose.Schema({
  // Esm el projet obligatoire.
  // trim yna77i el espaces mel louel w mel lekher.
  name: {
    type: String,
    required: [true, 'Project name is required.'],
    trim: true,
    maxlength: [120, 'Project name cannot exceed 120 characters.'],
  },

  // El description facultative.
  // Ken el user ma yekteb chay, nsajlou texte feragh.
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    default: '',
  },

  // Nsajlou el ID mta3 sa7eb el projet.
  // ref torbotna bel model User elli bech na3mlouh mba3d.
  // El controller bech ye5ou el ID mel user elli 3amel login.
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required.'],
    immutable: true,
  },

  // El projet yabda in_progress.
  // enum ma y5allinach nsajlou statut barra mel liste hedhi.
  status: {
    type: String,
    enum: {
      values: ['in_progress', 'completed', 'paused'],
      message: 'Invalid project status.',
    },
    default: 'in_progress',
  },

  // Date.now tet3ayet wa9t creation mta3 kol projet.
  // immutable ma t5allinach el date tetbaddel ba3d el creation.
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

// El model houwa elli bech nesta3mlouh bech na9raw
// w nsajlou el projets fel MongoDB.
module.exports = mongoose.model('Project', projectSchema);