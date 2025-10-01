import 'dotenv/config';
import app from './app.js';
import { sequelize } from './models/index.js';
import { connectMongo } from "./config/mongo.js";

connectMongo(); // Connexion à MongoDB



const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
  
    await sequelize.sync(); 
    console.log('✅ Modèles synchronisés avec la base');


    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (err) {
    console.error('Impossible de se connecter à la BDD:', err);
    process.exit(1);
  }
};

startServer();
