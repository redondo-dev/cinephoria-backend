
// src/controllers/reservation.controller.js
import Reservation from "../models/reservation.model.js";

export const createReservation = async (req, res) => {
  try {
    // On prend utilisateur_id du body (si fourni) sinon null
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

    return res.status(201).json(reservation);
  } catch (error) {
    console.error("Erreur lors de la création :", error);
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
