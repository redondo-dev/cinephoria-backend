// src/models/role.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Role = sequelize.define("Role", {

  id: {                   // clé primaire
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom_role: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  freezeTableName: true,
  tableName: "role",
  timestamps: false,
});

export default Role;
