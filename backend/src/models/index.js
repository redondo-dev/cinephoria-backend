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
import Avis from './avis.model.js';
import Siege from './siege.model.js';

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


// Association Réservation -> seance (une réservation concerne une séance)
Reservation.belongsTo(Seance, { foreignKey: "seance_id", as: 'seance', onDelete: "CASCADE" });
Seance.hasMany(Reservation, { foreignKey: "seance_id" ,as: "reservations",});

// // Avis -> Film (un avis concerne un film)
Avis.belongsTo(Film, { foreignKey: 'film_id', as: 'film', onDelete: 'CASCADE' });
Film.hasMany(Avis, { foreignKey: 'film_id', as: 'avis' });

//Avis -> Utilisateur (validé par un employé)
Avis.belongsTo(User, { foreignKey: 'utilisateur_id', as: 'utilisateur', onDelete: 'CASCADE' });
User.hasMany(Avis, { foreignKey: 'utilisateur_id', as: 'avisEcrits' });

// Avis → Utilisateur (validateur via motif_refus)
Avis.belongsTo(User, { foreignKey: 'motif_refus', as: 'validePar', constraints: false });
User.hasMany(Avis, { foreignKey: 'motif_refus', as: 'avisValides', constraints: false });


// Association Cinema -> Salle (1 cinéma a plusieurs salles)
Cinema.hasMany(Salle, { foreignKey: "cinema_id" });
Salle.belongsTo(Cinema, { foreignKey: "cinema_id" });

// Association User -> Reservation (1 utilisateur a plusieurs réservations)
User.hasMany(Reservation, { foreignKey: "utilisateur_id", as: "reservations" });
Reservation.belongsTo(User, { foreignKey: "utilisateur_id", as: "utilisateur" });


// Association Siege -> Salle (1 siège appartient à 1 salle)
Siege.belongsTo(Salle, { foreignKey: 'salle_id', as: 'salle', onDelete: 'CASCADE' });
Salle.hasMany(Siege, { foreignKey: 'salle_id', as: 'sieges' });

// Association Siege -> Reservation (1 siège peut avoir plusieurs réservations)
Siege.hasMany(Reservation, { foreignKey: 'siege_id', as: 'reservations' });
Reservation.belongsTo(Siege, { foreignKey: 'siege_id', as: 'siege' });


export { sequelize, Film, Seance, Salle, Cinema, Genre,User,Role,Reservation,Avis ,Siege};
