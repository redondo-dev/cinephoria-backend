// controllers/employee/seance.controller.js
import Seance from '../../models/seance.model.js';
import Film from '../../models/film.model.js';
import Salle from '../../models/salle.model.js';

// Récupérer toutes les séances
export const getAllSeances = async (req, res) => {
  try {
    const { filmId, salleId, dateDebut, dateFin } = req.query;
    
    // Construire le filtre de recherche
    let filter = {};
    if (filmId) filter.film = filmId;
    if (salleId) filter.salle = salleId;
    if (dateDebut || dateFin) {
      filter.dateHeure = {};
      if (dateDebut) filter.dateHeure.$gte = new Date(dateDebut);
      if (dateFin) filter.dateHeure.$lte = new Date(dateFin);
    }

    const seances = await Seance.find(filter)
      .populate('film', 'titre duree genre affiche')
      .populate('salle', 'numero nombrePlaces qualiteProjection')
      .sort({ dateHeure: 1 });

    res.status(200).json({
      success: true,
      count: seances.length,
      data: seances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des séances',
      error: error.message
    });
  }
};

// Récupérer une séance par ID
export const getSeanceById = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id)
      .populate('film')
      .populate('salle');
    
    if (!seance) {
      return res.status(404).json({
        success: false,
        message: 'Séance non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: seance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la séance',
      error: error.message
    });
  }
};

// Créer une nouvelle séance
export const createSeance = async (req, res) => {
  try {
    const { film, salle, dateHeure, tarif, langue, sousTitres } = req.body;

    // Validation des champs requis
    if (!film || !salle || !dateHeure || !tarif) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs requis (film, salle, dateHeure, tarif)'
      });
    }

    // Vérifier que le film existe
    const filmExists = await Film.findById(film);
    if (!filmExists) {
      return res.status(404).json({
        success: false,
        message: 'Film non trouvé'
      });
    }

    // Vérifier que la salle existe
    const salleExists = await Salle.findById(salle);
    if (!salleExists) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }

    // Vérifier que la date n'est pas dans le passé
    if (new Date(dateHeure) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La date et heure de la séance ne peuvent pas être dans le passé'
      });
    }

    // Calculer l'heure de fin de la séance
    const dateHeureDebut = new Date(dateHeure);
    const dateHeureFin = new Date(dateHeureDebut.getTime() + filmExists.duree * 60000 + 30 * 60000); // durée film + 30 min nettoyage

    // Vérifier qu'il n'y a pas de conflit avec d'autres séances dans la même salle
    const conflictSeance = await Seance.findOne({
      salle,
      $or: [
        // La nouvelle séance commence pendant une séance existante
        {
          dateHeure: { $lte: dateHeureDebut },
          dateHeureFin: { $gt: dateHeureDebut }
        },
        // La nouvelle séance se termine pendant une séance existante
        {
          dateHeure: { $lt: dateHeureFin },
          dateHeureFin: { $gte: dateHeureFin }
        },
        // La nouvelle séance englobe une séance existante
        {
          dateHeure: { $gte: dateHeureDebut },
          dateHeureFin: { $lte: dateHeureFin }
        }
      ]
    });

    if (conflictSeance) {
      return res.status(400).json({
        success: false,
        message: 'Un conflit d\'horaire existe avec une autre séance dans cette salle'
      });
    }

    const seance = await Seance.create({
      film,
      salle,
      dateHeure: dateHeureDebut,
      dateHeureFin,
      tarif,
      langue,
      sousTitres,
      placesDisponibles: salleExists.nombrePlaces,
      createdBy: req.user.id
    });

    // Populer les données avant de renvoyer
    await seance.populate('film', 'titre duree genre affiche');
    await seance.populate('salle', 'numero nombrePlaces qualiteProjection');

    res.status(201).json({
      success: true,
      message: 'Séance créée avec succès',
      data: seance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la séance',
      error: error.message
    });
  }
};

// Mettre à jour une séance
export const updateSeance = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id);

    if (!seance) {
      return res.status(404).json({
        success: false,
        message: 'Séance non trouvée'
      });
    }

    // Si la séance a déjà commencé, interdire les modifications
    if (seance.dateHeure < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une séance qui a déjà commencé'
      });
    }

    // Si la date/heure est modifiée, vérifier les conflits
    if (req.body.dateHeure || req.body.salle) {
      const newDateHeure = req.body.dateHeure ? new Date(req.body.dateHeure) : seance.dateHeure;
      const newSalle = req.body.salle || seance.salle;
      
      const film = await Film.findById(req.body.film || seance.film);
      const dateHeureFin = new Date(newDateHeure.getTime() + film.duree * 60000 + 30 * 60000);

      const conflictSeance = await Seance.findOne({
        _id: { $ne: req.params.id },
        salle: newSalle,
        $or: [
          {
            dateHeure: { $lte: newDateHeure },
            dateHeureFin: { $gt: newDateHeure }
          },
          {
            dateHeure: { $lt: dateHeureFin },
            dateHeureFin: { $gte: dateHeureFin }
          },
          {
            dateHeure: { $gte: newDateHeure },
            dateHeureFin: { $lte: dateHeureFin }
          }
        ]
      });

      if (conflictSeance) {
        return res.status(400).json({
          success: false,
          message: 'Un conflit d\'horaire existe avec une autre séance dans cette salle'
        });
      }

      req.body.dateHeureFin = dateHeureFin;
    }

    const updatedSeance = await Seance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    )
      .populate('film', 'titre duree genre affiche')
      .populate('salle', 'numero nombrePlaces qualiteProjection');

    res.status(200).json({
      success: true,
      message: 'Séance mise à jour avec succès',
      data: updatedSeance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la séance',
      error: error.message
    });
  }
};

// Supprimer une séance
export const deleteSeance = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id);

    if (!seance) {
      return res.status(404).json({
        success: false,
        message: 'Séance non trouvée'
      });
    }

    // Vérifier s'il y a des réservations pour cette séance
    const Reservation = await import('../../models/reservation.model.js');
    const reservationsCount = await Reservation.default.countDocuments({ seance: req.params.id });

    if (reservationsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette séance car ${reservationsCount} réservation(s) y sont associées`
      });
    }

    await Seance.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Séance supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la séance',
      error: error.message
    });
  }
};