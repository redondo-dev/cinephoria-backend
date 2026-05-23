// src/controllers/public/cinema/cinema.controller.js
import { Cinema, Film, Seance, Salle, Reservation } from "../../../models/index.js";
// ← Siege et sequelize supprimés (non utilisés)
import { Op } from "sequelize";

// Récupérer tous les cinémas
export const getCinemas = async (req, res) => {
  try {
    const cinemas = await Cinema.findAll({
      attributes: ['id', 'nom', 'ville'],
      order: [['nom', 'ASC']]
    });
    res.json(cinemas);
  } catch (error) {
    console.error("Erreur getCinemas:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des cinémas" });
  }
};

// Récupérer les films d'un cinéma
export const getFilmsByCinema = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Récupération des films pour le cinéma ${id}`);

    const cinema = await Cinema.findByPk(id);
    if (!cinema) {
      return res.status(404).json({ message: "Cinéma non trouvé" });
    }

    const films = await Film.findAll({
      attributes: ['id', 'titre', 'duree', 'affiche', 'description'],
      include: [
        {
          model: Seance,
          as: 'seances',
          required: true,
          where: {
            dateHeureDebut: { [Op.gte]: new Date() }
          },
          attributes: ['id', 'dateHeureDebut', 'dateHeureFin'], // ✅ hors du where
          include: [
            {
              model: Salle,
              as: 'salle',
              required: true,
              attributes: ['id', 'nom', 'nombrePlaces', 'qualiteProjection'],
              include: [
                {
                  model: Cinema,
                  as: 'cinema',
                  where: { id },
                  attributes: ['id', 'nom', 'ville']
                }
              ]
            }
          ]
        }
      ],
      distinct: true
    });

    console.log(`✅ ${films.length} films trouvés`);
    res.status(200).json(films);

  } catch (error) {
    console.error("❌ Erreur getFilmsByCinema:", error.message);
    res.status(500).json({
      message: "Erreur lors de la récupération des films",
      error: error.message
    });
  }
};

// Récupérer les séances d'un film dans un cinéma
export const getSeancesByFilm = async (req, res) => {
  try {
    const { cinemaId, filmId } = req.params;
    const nbPersonnes = parseInt(req.query.nbPersonnes) || 1;

    if (nbPersonnes < 1) {
      return res.status(400).json({ message: "Le nombre de personnes doit être au moins 1" });
    }

    const seances = await Seance.findAll({
      where: {
        filmId: parseInt(filmId),
        dateHeureDebut: { [Op.gte]: new Date() }
      },
      include: [
        {
          model: Salle,
          as: 'salle',
          attributes: ['id', ['nom_salle', 'nom'], ['capacite', 'nombrePlaces'],['qualite_projection', 'qualiteProjection'], 'cinema_id'],
          where: { cinema_id: cinemaId },
          include: [
            {
              model: Cinema,
              as: 'cinema',
              attributes: ['id', 'nom', 'ville']
            }
          ]
        },
        {
          model: Reservation,
          as: 'reservations',
          attributes: ['nb_places'],
          required: false
        }
      ],
      attributes: ['id', 'dateHeureDebut', 'dateHeureFin', 'filmId'],
      order: [['dateHeureDebut', 'ASC']]
    });

    if (seances.length === 0) return res.json([]);

    const seancesDisponibles = seances.map(seance => {
      const salle = seance.salle; // ✅ déclaration de salle

      const placesReservees = seance.reservations
        ?.reduce((sum, r) => sum + (r.nb_places || 0), 0) || 0;

      const capaciteSalle = salle?.nombrePlaces  || 0;
      console.log('Salle complète:', JSON.stringify(salle?.dataValues, null, 2));
      const placesDisponibles = capaciteSalle - placesReservees;
      const isFuture = new Date(seance.dateHeureDebut) >= new Date();

      if (placesDisponibles >= nbPersonnes && capaciteSalle > 0 && isFuture) {
        return {
          id: seance.id,
          dateHeureDebut: seance.dateHeureDebut,
          dateHeureFin: seance.dateHeureFin,
          salle: {
            id: salle.id,
            nom_salle: salle.nom, // ✅ nom_salle et non salle.nom
            capacite: capaciteSalle,
            qualite_projection: salle.qualiteProjection
          },
          places_disponibles: placesDisponibles,
          places_reservees: placesReservees
        };
      }
      return null;
    }).filter(Boolean);

    res.json(seancesDisponibles);

  } catch (error) {
    console.error("Erreur getSeancesByFilm:", error.message);
    res.status(500).json({
      message: "Erreur lors de la récupération des séances",
      error: error.message
    });
  }
};