// models/siege.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Siege = sequelize.define("Siege", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  
  numero_siege: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: "Le numéro de siège doit être au minimum 1"
      },
      max: {
        args: [100],
        msg: "Le numéro de siège ne peut pas dépasser 100"
      }
    }
  },
  
  rangee: {
    type: DataTypes.STRING(5),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "La rangée ne peut pas être vide"
      },
      len: {
        args: [1, 5],
        msg: "La rangée doit contenir entre 1 et 5 caractères"
      }
    }
  },
  
  type_siege: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Siège réservé aux personnes à mobilité réduite"
  },
  
  salle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'salle',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
}, {
  tableName: "siege",
  timestamps: true,
  indexes: [
    {
      // Index unique pour éviter les doublons de sièges dans une salle
      unique: true,
      fields: ['salle_id', 'rangee', 'numero_siege'],
      name: 'unique_siege_per_salle'
    },
    {
      // Index pour rechercher rapidement les sièges PMR
      fields: ['type_siege'],
      name: 'idx_siege_pmr'
    }
  ]
});

export default Siege;