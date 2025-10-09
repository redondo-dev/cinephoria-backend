// models/film.model.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';


const Film = sequelize.define('Film', {
  titre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  affiche: {
    type: DataTypes.STRING, 
  },
  age_min: {
    type: DataTypes.INTEGER,
  },
  duree: {
    type: DataTypes.INTEGER, 
    allowNull: false,
  },
  date_ajout: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  coup_coeur: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  note_moyenne: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  nb_avis: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  genre_id: {
    type: DataTypes.INTEGER,
    allowNull: true, 
  },
}, {
  tableName: 'film',
  timestamps: false, 
});


export default Film;
