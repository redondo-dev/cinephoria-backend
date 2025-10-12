
// src/models/user.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {


  id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
   prenom: {
      type: DataTypes.STRING,
      allowNull: false  
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false  
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
  role_id: { // <--= foreign key  vers la table role
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "role",
      key: "id",
    },
  },
   isConfirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
        field: 'isconfirmed'
    },
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
        field: 'mustchangepassword'
    },
//       tempPasswordExpiresAt: {
//         type: DataTypes.DATE,
//         allowNull: true,
//         field: 'temp_password_expires_at'
// }
  }
, {
  freezeTableName: true,
  tableName: "utilisateur",
  timestamps: false,
});

export default User;