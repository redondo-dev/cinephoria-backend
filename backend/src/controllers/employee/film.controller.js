// controllers/employee/film.controller.js
import Film from '../../models/film.model.js';

// Récupérer tous les films
export const getAllFilms = async (req, res) => {
  try {
    const films = await Film.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: films.length,
      data: films
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des films',
      error: error.message
    });
  }
};

// Récupérer un film par ID
export const getFilmById = async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);
    
    if (!film) {
      return res.status(404).json({
        success: false,
        message: 'Film non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: film
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du film',
      error: error.message
    });
  }
};

// Créer un nouveau film
export const createFilm = async (req, res) => {
  try {
    const {
      titre,
      description,
      affiche, 
      age_min,
      duree,
     date_ajout,
     coup_coeur,
     note_moyenne,
     nb_avis,
     genre_id
  
    } = req.body;

    // Validation des champs requis
    if (!titre || !description || !duree || !genre_id) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs requis (titre, description, durée, genre)'
      });
    }

    const film = await Film.create({
     titre,
      description,
      affiche, 
      age_min,
      duree,
     date_ajout,
     coup_coeur,
     note_moyenne,
     nb_avis,
     genre_id,
    createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Film créé avec succès',
      data: film
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du film',
      error: error.message
    });
  }
};

// Mettre à jour un film
export const updateFilm = async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);

    if (!film) {
      return res.status(404).json({
        success: false,
        message: 'Film non trouvé'
      });
    }

    const updatedFilm = await Film.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Film mis à jour avec succès',
      data: updatedFilm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du film',
      error: error.message
    });
  }
};

// Supprimer un film
export const deleteFilm = async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);

    if (!film) {
      return res.status(404).json({
        success: false,
        message: 'Film non trouvé'
      });
    }

    // Vérifier s'il y a des séances liées à ce film
    const Seance = await import('../../models/seance.model.js');
    const seancesCount = await Seance.default.countDocuments({ film: req.params.id });

    if (seancesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce film car ${seancesCount} séance(s) y sont associées`
      });
    }

    await Film.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Film supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du film',
      error: error.message
    });
  }
};