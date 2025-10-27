// src/controllers/public/cinema.controller.js
import { Cinema, Film, Seance,Genre, Salle, Siege, Reservation } from "../../../models/index.js";
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

// Récupérer les séances d'un film dans un cinéma
export const getSeancesByFilm = async (req, res) => {
  try {
    const { cinemaId, filmId } = req.params;
    const nbPersonnes = parseInt(req.query.nbPersonnes) || 1;

    if (nbPersonnes < 1) {
      return res.status(400).json({ 
        message: "Le nombre de personnes doit être au moins 1" 
      });
    }

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

    // Calculer les places disponibles pour chaque séance
    const seancesAvecDisponibilite = await Promise.all(
      seances.map(async (seance) => {
        const placesReservees = await Reservation.sum('nb_places', {
          where: { seance_id: seance.id }
        }) || 0;
        
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
    );

    // Filtrer les séances nulles (pas assez de places)
    const seancesDisponibles = seancesAvecDisponibilite.filter(s => s !== null);

    res.json(seancesDisponibles);
  } catch (error) {
    console.error("Erreur getSeancesByFilm:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des séances" });
  }
};

// Récupérer les sièges disponibles d'une séance
export const getSiegesDisponibles = async (req, res) => {
  try {
    const { id } = req.params;
    
    const seance = await Seance.findByPk(id, {
      include: { 
        model: Salle,
        attributes: ['id', 'nom_salle', 'capacite', 'qualite_projection']
      }
    });

    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    // Récupérer tous les sièges de la salle
    const sieges = await Siege.findAll({
      where: { salleId: seance.Salle.id },
      attributes: ['id', 'numero', 'rangee', 'pmr'],
      order: [['rangee', 'ASC'], ['numero', 'ASC']]
    });

    // Récupérer les sièges déjà réservés pour cette séance
    const reservations = await Reservation.findAll({
      where: { seanceId: id },
      include: {
        model: Siege,
        through: { attributes: [] },
        attributes: ['id']
      }
    });

    const siegesReservesIds = new Set(
      reservations.flatMap(r => r.Sieges.map(s => s.id))
    );

    // Marquer les sièges comme disponibles ou non
    const siegesAvecDisponibilite = sieges.map(siege => ({
      id: siege.id,
      numero: siege.numero,
      rangee: siege.rangee,
      pmr: siege.pmr,
      disponible: !siegesReservesIds.has(siege.id)
    }));

    res.json({
      salle: {
        id: seance.Salle.id,
        nom: seance.Salle.nom_salle,
        capacite: seance.Salle.capacite,
        qualiteProjection: seance.Salle.qualite_projection
      },
      sieges: siegesAvecDisponibilite
    });
  } catch (error) {
    console.error("Erreur getSiegesDisponibles:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des sièges" });
  }
};

// Calculer le prix d'une réservation
export const calculerPrix = async (req, res) => {
  try {
    const { seanceId, nbPersonnes } = req.body;

    if (!seanceId || !nbPersonnes) {
      return res.status(400).json({ 
        message: "seanceId et nbPersonnes sont requis" 
      });
    }

    if (nbPersonnes < 1) {
      return res.status(400).json({ 
        message: "Le nombre de personnes doit être au moins 1" 
      });
    }

    const seance = await Seance.findByPk(seanceId, {
      attributes: ['prix'],
      include: {
        model: Salle,
        attributes: ['qualite_projection']
      }
    });

    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    const prixUnitaire = parseFloat(seance.prix);
    const prixTotal = prixUnitaire * nbPersonnes;

    res.json({ 
      prixUnitaire: prixUnitaire.toFixed(2), 
      prixTotal: prixTotal.toFixed(2),
      qualiteProjection: seance.Salle.qualite_projection,
      nbPersonnes
    });
  } catch (error) {
    console.error("Erreur calculerPrix:", error);
    res.status(500).json({ message: "Erreur lors du calcul du prix" });
  }
};