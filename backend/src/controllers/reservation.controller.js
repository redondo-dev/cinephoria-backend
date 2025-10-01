
// src/controllers/reservation.controller.js

import { Reservation, Seance, Film } from "../models/index.js"; // Sequelize
import MongoReservation from "./mongo/mongo.reservation.model.js";

export const createReservation = async (req, res) => {
  try {
    // On prend utilisateur_id du body 
    const { utilisateur_id = null, seance_id, nb_places, prix_unitaire, date_expiration } = req.body;

    // Vérification des champs obligatoires
    if (!seance_id || !nb_places || !prix_unitaire) {
      return res.status(400).json({
        message: "Champs obligatoires manquants : seance_id, nb_places, prix_unitaire",
      });
    }

    // Création de la réservation
    const reservation = await Reservation.create({
      utilisateur_id,   // null pour visiteur
      seance_id,
      nb_places,
      prix_unitaire,
      date_expiration: date_expiration || null,
    });


//  Récupérer le titre du film via associations Sequelize
    const seance = await Seance.findOne({
      where: { id: seance_id },
      include: [
        {
          model: Film,
          as: "film",
          attributes: ["id", "titre"] // récupère juste l'id et le titre
        }
      ]
    });
// 🔹 Vérification des données récupérées
console.log("Seance récupérée :", seance);
console.log("Film associé :", seance?.film);
    if (seance && seance.film) {
      // Création de la copie dans MongoDB pour le dashboard US8
      console.log("Création Mongo :", {
    film_id: seance.film.id,
    titre: seance.film.titre,
    nb_places
  });
      const mongoRes=await MongoReservation.create({
        film_id: seance.film.id,
        titre: seance.film.titre,
        nb_places,
        date_reservation: new Date()
      });
      console.log("Réservation copiée dans MongoDB :", mongoRes);
    }


    return res.status(201).json({message:"Reservation crée",reservation});
  } catch (error) {
    console.error("Erreur lors de la création  de la Reservation:", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Récupérer toutes les réservations
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll();
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
// Récupérer une réservation par ID
export const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettre à jour une réservation
export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Reservation.update(req.body, { where: { id } });

    if (!updated) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    const updatedReservation = await Reservation.findByPk(id);
    res.json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer une réservation
export const deleteReservation = async (req, res) => {
  try {
    const deleted = await Reservation.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    res.json({ message: "Réservation supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};