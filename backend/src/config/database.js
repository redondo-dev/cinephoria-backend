
// export default sequelize;

import { Sequelize } from 'sequelize';

let sequelize;

// Priorité à DATABASE_URL si elle existe
if (process.env.DATABASE_URL) { 
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

// Test de connexion
sequelize.authenticate()
  .then(() => console.log(' Connexion à la DB réussie !'))
  .catch(err => {
    console.error('Erreur de connexion:');
    console.error('Message:', err.message);
  });

export default sequelize;