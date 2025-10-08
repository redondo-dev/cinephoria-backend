// src/models/reservation.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Reservation = sequelize.define(
  "Reservation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    utilisateur_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    seance_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nb_places: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    prix_unitaire: {
      type: DataTypes.NUMERIC,
      allowNull: false,
      defaultValue: 0,
    },
    // prix_total est généré en base de données
    prix_total: {
      type: DataTypes.VIRTUAL(DataTypes.NUMERIC, ['nb_places', 'prix_unitaire']),
      get() {
        return this.get('nb_places') * this.get('prix_unitaire');
      },
    },
    statut_reservation: {
      type: DataTypes.ENUM('en_attente', 'confirmee', 'annulee'),
      defaultValue: 'en_attente',
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "reservation",
    timestamps: false, 
  }
);

export default Reservation;
