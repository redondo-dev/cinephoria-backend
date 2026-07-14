import './config/env.js'; // Charger les variables d'environnement en premier
import 'dotenv/config';

import app from './app.js';
import { sequelize, Film, Seance, Salle, Cinema } from './models/index.js';
import { connectMongo } from './config/mongo.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Connexion à la base de données réussie');

    await sequelize.sync();
    console.log('Modèles synchronisés avec la base');

    // MongoDB sert uniquement aux donnees analytiques (films/reservations
    // des 7 derniers jours) : ce n'est pas une dependance critique pour
    // le fonctionnement de l'API. On tente la connexion sans bloquer
    // le demarrage du serveur si elle echoue.
    connectMongo()
      .then(() => console.log(' Connexion à MongoDB réussie'))
      .catch(err => {
        console.error('MongoDB indisponible au demarrage — les fonctionnalites analytiques seront degradees:', err.message);
      });

    // Demarrer le serveur des que PostgreSQL est pret, sans attendre MongoDB
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (err) {
    console.error('Impossible de se connecter a la BDD:', err);
    process.exit(1);
  }
};

startServer();