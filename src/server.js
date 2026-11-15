// Na9raw el configuration mel fichier .env 9bal el app.
require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./config/database');

const port = process.env.PORT || 3000;

// Nestannew MongoDB tetconnecta 9bal ma nabdew el serveur.
async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });

    // Ken el port deja mest3amel, nwarriw erreur wad7a.
    server.on('error', (error) => {
      console.error('Server failed to start:', error.message);
      process.exit(1);
    });
  } catch (error) {
    // Ken connexion MongoDB tefchel, nwa9fou el demarrage.
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

startServer();
