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
          required: false,
          where: {
            dateHeureDebut: {
              [Op.gte]: new Date(), // ✅ à partir d'aujourd'hui
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
      raw: false, 
      nest: true, 
    });

    console.log(`✅ ${films.length} films trouvés`);
    res.status(200).json(films);

  } catch (error) {
    console.error("❌ Erreur getFilmsByCinema:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Erreur lors de la récupération des films",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Récupérer les séances d'un film dans un cinéma (OPTIMISÉ)
export const getSeancesByFilm = async (req, res) => {
  try {
    const { cinemaId, filmId } = req.params;
    const nbPersonnes = parseInt(req.query.nbPersonnes) || 1;

    if (nbPersonnes < 1) {
      return res.status(400).json({ 
        message: "Le nombre de personnes doit être au moins 1" 
      });
    }

    console.log('🔍 Paramètres reçus:', { cinemaId, filmId, nbPersonnes });
    console.log('🔍 Recherche avec:', {
  film_id: parseInt(filmId),
  cinema_id: parseInt(cinemaId),
  nbPersonnes
});

    // ✅ OPTIMISATION: Une seule requête avec tous les includes nécessaires
    const seances = await Seance.findAll({
      where: { 
        film_id:parseInt(filmId), 
        dateHeureDebut: { [Op.gte]: new Date() } // ✅ Filtre les séances futures uniquement
      },
      include: [
        { 
          model: Salle,
          as: 'salle',
          attributes: ['id', 'nom_salle', 'capacite', 'qualite_projection', 'cinema_id'],
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
          required: false // ✅ LEFT JOIN pour avoir les séances sans réservations
        }
      ],
      attributes: ['id', 'date_seance', 'dateHeureDebut', 'dateHeureFin', 'filmId'],
      order: [['dateHeureDebut', 'ASC']]
    });

    console.log(`📅 ${seances.length} séances trouvées`);

    if (seances.length === 0) {
      console.log('❌ Aucune séance trouvée pour ces paramètres');
      return res.json([]);
    }

    // ✅ Calculer les places disponibles et filtrer
    const seancesDisponibles = seances
      .map(seance => {
        // Calculer le total des places réservées
        const placesReservees = seance.reservations
          ? seance.reservations.reduce((sum, r) => sum + (r.nb_places || 0), 0)
          : 0;
        
        const salle = seance.salle;
        const capaciteSalle = salle?.capacite || 0;
        const placesDisponibles = capaciteSalle - placesReservees;

        // ✅ FIX CRITIQUE: Vérifier que la séance est future (déjà filtré par la requête, mais double sécurité)
        const isFuture = new Date(seance.dateHeureDebut) >= new Date();
        console.log(`Séance ${seance.id}: capacité=${capaciteSalle}, réservées=${placesReservees}, dispo=${placesDisponibles}, future=${isFuture}`);
        // Filtrer: places suffisantes + capacité valide
        if (placesDisponibles >= nbPersonnes && capaciteSalle > 0 && isFuture) {
          return {
            id: seance.id,
            date_seance: seance.date_seance,
            dateHeureDebut: seance.dateHeureDebut,
            dateHeureFin: seance.dateHeureFin,
            salle: {
              id: salle.id,
              nom_salle: salle.nom_salle,
              capacite: capaciteSalle,
              qualite_projection: salle.qualite_projection
            },
            places_disponibles: placesDisponibles,
            places_reservees: placesReservees
          };
        }
        return null;
      })
      .filter(s => s !== null);

    console.log(`✅ ${seancesDisponibles.length} séances disponibles pour ${nbPersonnes} personne(s)`);

    res.json(seancesDisponibles);
    
  } catch (error) {
    console.error("❌ Erreur getSeancesByFilm:", error);
    console.error("📝 Stack trace:", error.stack);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des séances",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

