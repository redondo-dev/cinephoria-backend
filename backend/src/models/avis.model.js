// models/avis.model.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Avis = sequelize.define('Avis', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },  
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  film_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'film',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }, 
  contenu: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Le commentaire ne peut pas dépasser 1000 caractères'
      }
    }
  },
  note: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    validate: {
      min: 0,
      max: 5,
      isDecimal: true
    },
    comment: 'Note sur 5 (ex: 4.5)'
  },
  date_avis: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  statut_avis: {
    type: DataTypes.ENUM('en_attente', 'valide', 'rejete'),
    allowNull: false,
    defaultValue: 'en_attente',
    comment: 'Statut de modération de l\'avis'
  }, 
  motif_refus: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'utilisateur',
      key: 'id'
    },
    comment: 'ID de l\'employé qui a validé/rejeté l\'avis'
  },
  date_validation: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de validation/rejet de l\'avis'
  }
}, 
{
  tableName: 'avis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['film_id']
    },
    {
      fields: ['utilisateur_id']  
    },
    {
      fields: ['statut_avis']  
    },
    {
      fields: ['date_avis']
    },
    {
      unique: true,
      fields: ['film_id', 'utilisateur_id'],  
      name: 'unique_avis_per_user_per_film'
    }
  ]
});

Avis.beforeValidate((avis) => {
  if (avis.note) {
    avis.note = Math.round(avis.note * 2) / 2;
  }
});

export default Avis;