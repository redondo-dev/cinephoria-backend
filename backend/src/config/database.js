// import { Sequelize } from 'sequelize';


// // Vérification des variables
// console.log('DB_USER:', process.env.DB_USER);
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
// console.log('DB_HOST:', process.env.DB_HOST);
// console.log('NODE_ENV:', process.env.NODE_ENV);


// // Initialisation Sequelize

// const sequelize = new Sequelize(
//   process.env.DB_NAME,      // nom de la base
//   process.env.DB_USER,      // utilisateur
//   process.env.DB_PASSWORD,  // mot de passe
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT || 5432,
//     dialect: 'postgres',
//     logging: false,  
//     // logging: process.env.NODE_ENV === 'development' ? console.log : false,      
//     // Ajout pour SSL
//   dialectOptions: {
//         ssl: process.env.NODE_ENV === 'production' ? {
//            require: true,
//            rejectUnauthorized: false // nécessaire pour Render
//         } :false 
//       },
     
  
//  // Options supplémentaires recommandées
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     }
//    }
// );
// // Test de connexion
// sequelize.authenticate()
//   .then(() => console.log('Connexion à la DB réussie !'))
//   .catch(err => console.error('Erreur de connexion :', err));

  
// export default sequelize;

import { Sequelize } from 'sequelize';

console.log('=== Configuration DB ===');
console.log('NODE_ENV:', process.env.NODE_ENV);

let sequelize;

// Priorité à DATABASE_URL si elle existe
if (process.env.DATABASE_URL) {
  console.log(' Utilisation de DATABASE_URL');
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Fallback sur variables individuelles
  console.log(' Utilisation des variables individuelles');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);
  
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

console.log('========================');

// Test de connexion
sequelize.authenticate()
  .then(() => console.log(' Connexion à la DB réussie !'))
  .catch(err => {
    console.error('Erreur de connexion:');
    console.error('Message:', err.message);
  });

export default sequelize;