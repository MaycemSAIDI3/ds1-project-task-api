const mongoose = require('mongoose');

// El schema hedha yfassar el donnees mta3 kol tache.
// Kol tache lezem tkoun marbouta b projet.
const taskSchema = new mongoose.Schema({
  // El titre obligatoire.
  // trim yna77i el espaces mel louel w mel lekher.
  title: {
    type: String,
    required: [true, 'Task title is required.'],
    trim: true,
    maxlength: [120, 'Task title cannot exceed 120 characters.'],
  },

  // El description facultative.
  // Ken ma famech description, nsajlou texte feragh.
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    default: '',
  },

  // El tache tabda todo.
  // Ma na9blou ken el trois valeurs elli fel liste hedhi.
  status: {
    type: String,
    enum: {
      values: ['todo', 'doing', 'done'],
      message: 'Task status must be todo, doing, or done.',
    },
    default: 'todo',
  },

  // El deadline hiya el date limite mta3 el tache.
  // Ken ma t7addedtech, el valeur tab9a null.
  deadline: {
    type: Date,
    default: null,
  },

  // Nsajlou el ID mta3 el projet elli tetba3lou el tache.
  // El controller lezem yetthabet elli el projet mawjoud
  // w elli el user 3andou el permission lezem.
  // immutable ma t5allinach nna9lou el tache l projet e5er.
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'An associated project is required.'],
    immutable: true,
  },

  // El tache tnajjem tabda bla user assigne.
  // El controller bech yetthabet elli ken el manager
  // ynajjem yaffectiha, fel creation w fel modification.
  // El schema wa7dou ma ythabbetch mel role.
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Nsajlou wa9tech el tache t3amlet.
  // El date hedhi ma tetbaddelch ba3d el creation.
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

// Nsaddrou el model bech nesta3mlouh fel controllers.
module.exports = mongoose.model('Task', taskSchema);