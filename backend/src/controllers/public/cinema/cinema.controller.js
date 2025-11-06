// src/controllers/public/cinema.controller.js
import { Cinema, Film, Seance, Genre, Salle, Siege, Reservation } from "../../../models/index.js";
import { Op } from "sequelize";
import sequelize from "../../../config/database.js";

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

    // Vérifier que le cinéma existe
    const cinema = await Cinema.findByPk(id);
    if (!cinema) {
      console.log(`Cinéma ${id} non trouvé`);
      return res.status(404).json({ message: "Cinéma non trouvé" });
    }

    console.log(`Cinéma trouvé: ${cinema.nom}`);

    // Requête Sequelize pour récupérer les films avec séances dans ce cinéma
    const films = await Film.findAll({
      attributes: ['id', 'titre', 'duree', 'affiche', 'description'],
      include: [
        {
          model: Genre,
          as: 'genre',
          attributes: ['id', 'nom'],
        },
        {
          model: Seance,
          as: 'seances',
          required: true,
          where: {
            date_seance: {
              [Op.gte]: new Date(), // à partir d'aujourd'hui
            },
          },
          include: [
            {
              model: Salle,
              as: 'salle',
              required: true,
              include: [
                {
                  model: Cinema,
                  as: 'cinema',
                  where: { id }, // filtrage par cinéma
                },
              ],
            },
          ],
        },
      ],
      distinct: true,
    });

    console.log(` ${films.length} films trouvés`);
    res.status(200).json(films);

  } catch (error) {
    console.error("Erreur getFilmsByCinema:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Erreur lors de la récupération des films",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
//Récupérer les séances d'un film dans un cinéma
export const getSeancesByFilm = async (req, res) => {
  try {
    const { cinemaId, filmId } = req.params;
    const nbPersonnes = parseInt(req.query.nbPersonnes) || 1;

    if (nbPersonnes < 1) {
      return res.status(400).json({ 
        message: "Le nombre de personnes doit être au moins 1" 
      });
    }

    // 1️- Récupérer toutes les séances
    const seances = await Seance.findAll({
      where: { 
        film_id: filmId,
        dateHeureDebut: { [Op.gte]: new Date() }
      },
      include: [
        { 
          model: Salle,
          as: 'salle',
          attributes: ['id', 'nom_salle', 'capacite', 'qualite_projection'],
          where: { cinema_id: cinemaId },
        }
      ],
      attributes: ['id', 'date_seance', 'dateHeureDebut', 'dateHeureFin'],
      order: [['date_seance', 'ASC'], ['dateHeureDebut', 'ASC']]
    });

    if (seances.length === 0) {
      return res.json([]);
    }

    // 2️- Récupérer TOUTES les réservations en UNE SEULE requête
    const seanceIds = seances.map(s => s.id);
    
    const reservations = await Reservation.findAll({
      where: { seance_id: seanceIds },
      attributes: [
        'seance_id',
        [sequelize.fn('SUM', sequelize.col('nb_places')), 'total_places']
      ],
      group: ['seance_id'],
      raw: true
    });

    // 3️-Créer un map pour accès rapide 
    const reservationsMap = {};
    reservations.forEach(r => {
      reservationsMap[r.seance_id] = parseInt(r.total_places) || 0;
    });

    // 4️-Filtrer et enrichir les séances avec les places disponibles
    const seancesDisponibles = seances
      .map(seance => {
        const placesReservees = reservationsMap[seance.id] || 0;
        const placesDisponibles = seance.salle.capacite - placesReservees;
        
        // Ne retourner que les séances avec assez de places
        if (placesDisponibles >= nbPersonnes) {
          return {
            id: seance.id,
            date_seance: seance.date_seance,
            dateHeureDebut: seance.dateHeureDebut,
            dateHeureFin: seance.dateHeureFin,
            salle: {
              id: seance.salle.id,
              nom: seance.salle.nom_salle,
              capacite: seance.salle.capacite,
              qualiteProjection: seance.salle.qualite_projection
            },
            placesDisponibles
          };
        }
        return null;
      })
      .filter(s => s !== null);

    res.json(seancesDisponibles);
    
  } catch (error) {
    console.error("Erreur getSeancesByFilm:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des séances" });
  }
};
