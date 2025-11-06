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

    //2- Connecter MongoDB
    await connectMongo();
    console.log(' Connexion à MongoDB réussie');


    //Démarrer le serveur APRÈS que tout soit connecté
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (err) {
    console.error('Impossible de se connecter à la BDD:', err);
    process.exit(1);
  }
};

startServer();
