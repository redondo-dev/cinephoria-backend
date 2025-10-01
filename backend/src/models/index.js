// models/index.js
import sequelize from '../config/database.js';
import Film from './film.model.js';
import Seance from './seance.model.js';
import Salle from './salle.model.js';
import Cinema from './cinema.model.js';
import Genre from './genre.model.js';
import User from './user.model.js';
import Role from './role.model.js';
import Reservation from './reservation.model.js';



// Les Associations

// Film -> Seance (1 film a plusieurs séances)
Film.hasMany(Seance, { foreignKey: 'film_id', as: 'seances' });
Seance.belongsTo(Film, { foreignKey: 'film_id', as: 'film' });

// Film -> Genre (1 film appartient à 1 genre)
Film.belongsTo(Genre, { foreignKey: 'genre_id', as: 'genre' });
Genre.hasMany(Film, { foreignKey: 'genre_id', as: 'films' });

// Seance -> Salle (1 séance se déroule dans 1 salle)
Seance.belongsTo(Salle, { foreignKey: 'salle_id', as: 'salle' });
Salle.hasMany(Seance, { foreignKey: 'salle_id', as: 'seances' });

// Salle -> Cinema (1 salle appartient à 1 cinéma)
Salle.belongsTo(Cinema, { foreignKey: 'cinema_id', as: 'cinema' });
Cinema.hasMany(Salle, { foreignKey: 'cinema_id', as: 'salles' });


// Association : un utilisateur a un rôle
User.belongsTo(Role, { foreignKey: "role_id", as: "roleDetails" });
Role.hasMany(User, { foreignKey: "role_id", as: "users" });


// Association
Reservation.belongsTo(Seance, { foreignKey: "seance_id", onDelete: "CASCADE" });
Seance.hasMany(Reservation, { foreignKey: "seance_id" });



export { sequelize, Film, Seance, Salle, Cinema, Genre,User,Role,Reservation };
