import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); 

// Vérification des variables
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

// Initialisation Sequelize

const sequelize = new Sequelize(
  process.env.DB_NAME,      // nom de la base
  process.env.DB_USER,      // utilisateur
  process.env.DB_PASSWORD,  // mot de passe
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,        
  }
);
export default sequelize;