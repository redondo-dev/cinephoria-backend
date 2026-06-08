// models/filmGenre.model.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FilmGenre = sequelize.define('film_genre', {
  film_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  genre_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  }
}, {
  tableName: 'film_genre',
  timestamps: false
});

export default FilmGenre;