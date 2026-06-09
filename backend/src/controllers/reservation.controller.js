// src/controllers/reservation.controller.js
import { Reservation, Seance, Film, Salle, Cinema, Siege ,User} from "../models/index.js";
import { sendTicketEmail } from '../utils/sendEmailConfirmation.js';

export const createReservation = async (req, res) => {
  try {
    const { utilisateur_id = null, seance_id, nb_places, prix_unitaire, date_expiration,sieges ,statut_reservation} = req.body;

    if (!seance_id || !nb_places || !prix_unitaire) {
      return res.status(400).json({
        message: "Champs obligatoires manquants : seance_id, nb_places, prix_unitaire",
      });
    }

    const reservation = await Reservation.create({
      utilisateur_id,
      seance_id,
      nb_places,
      prix_unitaire,
      date_expiration: date_expiration || null,
      statut_reservation: statut_reservation || 'en_attente', 
    });
  if (sieges && sieges.length > 0) {
      await reservation.addSiegesReserves(sieges); // méthode générée par belongsToMany
    }
    return res.status(201).json(reservation);
  } catch (error) {
    console.error("Erreur lors de la création :", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll();
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Corrigé — avec toutes les jointures
export const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        {
          model: Seance,
          as: "seance",
          include: [
            {
              model: Film,
              as: "film",
              attributes: ["titre"],
            },
            {
              model: Salle,
              as: "salle",
              attributes: ["nom"],
              include: [
                {
                  model: Cinema,
                  as: "cinema",
                  attributes: ["nom"],
                },
              ],
            },
          ],
        },
        {
          model: Siege,
          as: "siegesReserves",          // ✅ alias exact défini dans models/index.js
          attributes: ["rangee", "numero_siege"],
          through: { attributes: [] },   // masque les colonnes de la table pivot
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    console.log("✅ Réservation :", JSON.stringify(reservation, null, 2)); // à retirer après debug

    res.json(reservation);
  } catch (error) {
    console.error("❌ Erreur getReservationById :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Reservation.update(req.body, { where: { id } });

    if (!updated) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    res.json(await Reservation.findByPk(id));
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

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

// / 2. ✅ Ajouter cette fonction à la fin du fichier
export const sendTicketByEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
      include: [
        {
          model: Seance, as: 'seance',
          include: [
            { model: Film,  as: 'film',  attributes: ['titre'] },
            { model: Salle, as: 'salle', attributes: ['nom'],
              include: [{ model: Cinema, as: 'cinema', attributes: ['nom'] }]
            },
          ],
        },
        {
          model: Siege, as: 'siegesReserves',
          attributes: ['rangee', 'numero_siege'],
          through: { attributes: [] },
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    const user = await User.findByPk(reservation.utilisateur_id, {
      attributes: ['email'],
    });

    if (!user?.email) {
      return res.status(400).json({ message: 'Email utilisateur introuvable' });
    }

    await sendTicketEmail({ to: user.email, reservation });

    res.json({ message: 'Email envoyé avec succès' });
  } catch (err) {
     console.error("❌ Erreur DÉTAILLÉE envoi email billet :", err); // ← remplacer par ça
    throw new Error("Impossible d'envoyer l'email de billet");
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email", error: error.message });
  }
};