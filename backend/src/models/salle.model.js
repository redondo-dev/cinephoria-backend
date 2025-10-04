// models/salle.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Salle = sequelize.define("Salle", {
 
  nom_salle: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Le nom de la salle ne peut pas être vide"
      }
    }
  },

  capacite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: "La capacité doit être au minimum de 1 place"
      },
      max: {
        args: [1000],
        msg: "La capacité ne peut pas dépasser 1000 places"
      }
    }
  },

  cinema_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cinema', // Nom de la table référencée
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE' // Si le cinéma est supprimé, ses salles aussi
  },

  qualite_projection: {
    type: DataTypes.ENUM('Standard', 'IMAX', '2D', '3D', '4DX', 'Dolby Atmos', 'ScreenX'),
    allowNull: false,
    defaultValue: 'Standard',
    validate: {
      isIn: {
        args: [['Standard', 'IMAX', '2D', '3D', '4DX', 'Dolby Atmos', 'ScreenX']],
        msg: "Qualité de projection invalide"
      }
    }
  }
}, {
  tableName: "salle",
  timestamps: true, 
  

});

export default Salle;
