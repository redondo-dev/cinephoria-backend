// src/controllers/user/avis.controller.js
import { Op } from "sequelize";
import Avis from "../../models/avis.model.js";
import Film from "../../models/film.model.js";
import Reservation from "../../models/reservation.model.js";
import Seance from "../../models/seance.model.js";

/**
 * Créer un nouvel avis pour un film
 * L'utilisateur peut noter uniquement les films dont la séance est passée
 */
export const createAvis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { film_id, note, commentaire } = req.body;

    if (!film_id || !note) {
      return res.status(400).json({ error: "film_id et note sont requis" });
    }

    if (note < 1 || note > 5) {
      return res.status(400).json({ error: "La note doit être entre 1 et 5" });
    }

    const film = await Film.findByPk(film_id);
    if (!film) {
      return res.status(404).json({ error: "Film non trouvé" });
    }

    // Vérifier que l'utilisateur a réservé une séance passée de ce film
    const maintenant = new Date();
    const reservation = await Reservation.findOne({
      where: { utilisateur_id: userId },
      include: [
        {
          model: Seance,
          as: "seance",
          where: { film_id, date_seance: { [Op.lt]: maintenant } },
          attributes: [],
        },
      ],
    });

    if (!reservation) {
      return res.status(403).json({
        error: "Vous pouvez noter uniquement les films dont la séance est passée",
      });
    }

    // Vérifier qu’un avis n’existe pas déjà pour ce film
    const avisExistant = await Avis.findOne({
      where: { utilisateur_id: userId, film_id },
    });

    if (avisExistant) {
      return res.status(409).json({ error: "Vous avez déjà noté ce film" });
    }

    // Créer l'avis
    const nouvelAvis = await Avis.create({
      utilisateur_id: userId,
      film_id,
      note,
      contenu: commentaire || null,
      date_avis: new Date(),
      statut: "en_attente",
    });

    res.status(201).json({
      success: true,
      message: "Avis créé avec succès (en attente de validation)",
      data: nouvelAvis,
    });
  } catch (error) {
    console.error("Erreur createAvis:", error);
    res.status(500).json({ error: "Erreur lors de la création de l’avis" });
  }
};

/**
 * Récupérer tous les avis de l'utilisateur connecté
 */
export const getMesAvis = async (req, res) => {
  try {
    const userId = req.user.id;

    const avis = await Avis.findAll({
      where: { utilisateur_id: userId },
      include: [
        {
          model: Film,
          as: "film",
          attributes: ["id", "titre", "affiche", "duree"],
        },
      ],
      order: [["date_avis", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: avis.length,
      data: avis.map((a) => ({
        id: a.id,
        note: a.note,
        contenu: a.contenu,
        date_avis: a.date_avis,
        statut: a.statut,
        film: a.film,
      })),
    });
  } catch (error) {
    console.error("Erreur getMesAvis:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des avis" });
  }
};

/**
 * Récupérer la liste des films à noter
 * Films réservés dont la séance est passée et non encore notés
 */
export const getFilmsANoter = async (req, res) => {
  try {
    const userId = req.user.id;
    const maintenant = new Date();

    // Récupérer toutes les réservations passées
    const reservations = await Reservation.findAll({
      where: { utilisateur_id: userId },
      include: [
        {
          model: Seance,
          as: "seance",
          where: { date_seance: { [Op.lt]: maintenant } },
          attributes: ["film_id"],
        },
      ],
    });

    const filmIds = [...new Set(reservations.map((r) => r.seance.film_id))];

    if (filmIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Exclure les films déjà notés
    const avisExistants = await Avis.findAll({
      where: { utilisateur_id: userId, film_id: { [Op.in]: filmIds } },
      attributes: ["film_id"],
      raw: true,
    });

    const filmsNotesIds = avisExistants.map((a) => a.film_id);
    const filmsANoterIds = filmIds.filter((id) => !filmsNotesIds.includes(id));

    if (filmsANoterIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Récupérer les détails des films à noter
    const filmsANoter = await Film.findAll({
      where: { id: { [Op.in]: filmsANoterIds } },
      attributes: ["id", "titre", "affiche", "duree"],
    });

    res.status(200).json({
      success: true,
      count: filmsANoter.length,
      data: filmsANoter,
    });
  } catch (error) {
    console.error("Erreur getFilmsANoter:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des films à noter" });
  }
};
