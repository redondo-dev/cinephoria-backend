// models/cinema.modele.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Cinema = sequelize.define("Cinema", {

    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ville: {
    type: DataTypes.STRING,
    allowNull: false,
  },
 
}, {
  tableName: "cinema",
  timestamps: false,
});

export default Cinema;
