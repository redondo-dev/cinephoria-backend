// controllers/employee/salle.controller.js
import Salle from '../../models/salle.model.js';

// Récupérer toutes les salles
export const getAllSalles = async (req, res) => {
  try {
    const salles = await Salle.find().sort({ numero: 1 });
    res.status(200).json({
      success: true,
      count: salles.length,
      data: salles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des salles',
      error: error.message
    });
  }
};

// Récupérer une salle par ID
export const getSalleById = async (req, res) => {
  try {
    const salle = await Salle.findById(req.params.id);
    
    if (!salle) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: salle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la salle',
      error: error.message
    });
  }
};

// Créer une nouvelle salle
export const createSalle = async (req, res) => {
  try {
    const { numero, nombrePlaces, qualiteProjection } = req.body;

    // Validation des champs requis
    if (!numero || !nombrePlaces || !qualiteProjection) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs requis (numéro, nombre de places, qualité de projection)'
      });
    }

    // Vérifier si le numéro de salle existe déjà
    const salleExistante = await Salle.findOne({ numero });
    if (salleExistante) {
      return res.status(400).json({
        success: false,
        message: 'Une salle avec ce numéro existe déjà'
      });
    }

    // Validation de la qualité de projection
    const qualitesValides = ['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema'];
    if (!qualitesValides.includes(qualiteProjection)) {
      return res.status(400).json({
        success: false,
        message: `Qualité de projection invalide. Valeurs acceptées : ${qualitesValides.join(', ')}`
      });
    }

    // Validation du nombre de places
    if (nombrePlaces < 1 || nombrePlaces > 500) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre de places doit être entre 1 et 500'
      });
    }

    const salle = await Salle.create({
      numero,
      nombrePlaces,
      qualiteProjection,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Salle créée avec succès',
      data: salle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la salle',
      error: error.message
    });
  }
};

// Mettre à jour une salle
export const updateSalle = async (req, res) => {
  try {
    const salle = await Salle.findById(req.params.id);

    if (!salle) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }

    // Si le numéro est modifié, vérifier qu'il n'existe pas déjà
    if (req.body.numero && req.body.numero !== salle.numero) {
      const salleExistante = await Salle.findOne({ numero: req.body.numero });
      if (salleExistante) {
        return res.status(400).json({
          success: false,
          message: 'Une salle avec ce numéro existe déjà'
        });
      }
    }

    const updatedSalle = await Salle.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Salle mise à jour avec succès',
      data: updatedSalle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la salle',
      error: error.message
    });
  }
};

// Supprimer une salle
export const deleteSalle = async (req, res) => {
  try {
    const salle = await Salle.findById(req.params.id);

    if (!salle) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }

    // Vérifier s'il y a des séances liées à cette salle
    const Seance = await import('../../models/seance.model.js');
    const seancesCount = await Seance.default.countDocuments({ salle: req.params.id });

    if (seancesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette salle car ${seancesCount} séance(s) y sont associées`
      });
    }

    await Salle.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Salle supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la salle',
      error: error.message
    });
  }
};