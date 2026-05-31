import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';


  const Incident = sequelize.define('Incident', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date_incident: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    date_resolution: {
      type: DataTypes.DATE,
      allowNull: true
    },
    statut: {
      type: DataTypes.STRING(50),
      defaultValue: 'ouvert'
    },
    priorite: {
      type: DataTypes.STRING(20),
      defaultValue: 'moyenne'
    },
    utilisateur_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    salle_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'incident',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  
export default Incident;