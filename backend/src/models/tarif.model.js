// models/tarif.model.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Tarif = sequelize.define('Tarif', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom_tarif: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  type_tarif: {
    type: DataTypes.STRING(30),
    allowNull: true,
    validate: {
      isIn: [['reduit', 'réduit', 'normal']]
    }
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tarif',
  timestamps: false
});

export default Tarif;