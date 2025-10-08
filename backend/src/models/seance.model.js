// models/seance.model.js

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";



const Seance = sequelize.define("Seance", {

    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date_seance: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
 film_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'film',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
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
  },
  dateHeureDebut: {
  type: DataTypes.DATE,
  allowNull: false,
  field: 'date_heure_debut' 
},
dateHeureFin: {
  type: DataTypes.DATE,
  allowNull: false,
  field: 'date_heure_fin'
}
}, {
  tableName: "seance",
  timestamps: false,
});




export default Seance;
