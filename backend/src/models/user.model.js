
// src/models/user.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role_id: { // foreign key vers la table role
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  freezeTableName: true,
  tableName: "utilisateur",
  timestamps: false,
});

export default User;