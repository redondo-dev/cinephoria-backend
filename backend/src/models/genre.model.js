// models/Genre.model.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; 

const Genre = sequelize.define('Genre', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'genre',      
  timestamps: false          
});

export default Genre;
