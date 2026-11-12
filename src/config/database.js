const mongoose = require('mongoose');

// El fonction hedhi torbot el application bel MongoDB.
// Nesta3mlou async bech nestannew el connexion 9bal ma nkamlou.
async function connectDatabase() {
  // Na9raw el adresse mel environnement bech ma n7ottouch
  // configuration wala passwords directement fel code.
  const databaseUri = process.env.MONGODB_URI;

  // Ken el adresse ma famech, nwa9fou b erreur wad7a.
  // Hakka na3rfou elli el configuration ne9sa.
  if (!databaseUri) {
    throw new Error('MONGODB_URI is required. Check your .env file.');
  }

  // Mongoose y7awel yetconnecta bel base.
  // Ken ma l9ach serveur fi 5 secondes, yrajja3 erreur.
  // El fichier elli y3ayet lel fonction bech yetkafal bel erreur.
  await mongoose.connect(databaseUri, {
    serverSelectionTimeoutMS: 5000,
  });

  // El message hedha yokhrej ken ba3d connexion nej7a.
  console.log('MongoDB connected successfully.');
}

// Nsaddrou el fonction bech nesta3mlouha mba3d
// fel fichier elli bech yabda mennou el serveur.
module.exports = connectDatabase;