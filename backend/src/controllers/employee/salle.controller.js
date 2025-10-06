// controllers/employee/salle.controller.js
import Salle from '../../models/salle.model.js';
import Seance from '../../models/seance.model.js';

// ======================================================
// Récupérer toutes les salles
// ======================================================
export const getAllSalles = async (req, res) => {
  try {
    const salles = await Salle.findAll(); // 
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

// ======================================================
// Récupérer une salle par ID
// ======================================================
export const getSalleById = async (req, res) => {
  try {
    const salle = await Salle.findByPk(req.params.id);

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

// ======================================================
// Créer une nouvelle salle
// ======================================================
export const createSalle = async (req, res) => {
  try {
    const { nom_salle, capacite,cinema_id, qualite_projection } = req.body;

    // Validation des champs requis
    if (!nom_salle || !capacite || !qualite_projection|| !cinema_id) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs requis (nom_salle, capacite,cinema_id qualité de projection)'
      });
    }

    // Vérifier si une salle avec le même nom existe déjà
    const salleExistante = await Salle.findOne({ where: { nom_salle } });
    if (salleExistante) {
      return res.status(400).json({
        success: false,
        message: 'Une salle avec ce nom existe déjà'
      });
    }

    //  Validation de la qualité de projection
    const qualitesValides = ['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema'];
    if (!qualitesValides.includes(qualite_projection)) {
      return res.status(400).json({
        success: false,
        message: `Qualité de projection invalide. Valeurs acceptées : ${qualitesValides.join(', ')}`
      });
    }

    // Validation du nombre de places
    if (capacite < 1 || capacite > 500) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre de places doit être entre 1 et 500'
      });
    }

    // Création de la salle
    
    const newSalle = await Salle.create({
      nom_salle,
      capacite,
      cinema_id,
      qualite_projection,
    });
    res.status(201).json({
      success: true,
      message: 'Salle créée avec succès',
      data: newSalle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la salle',
      error: error.message
    });
  }
};

// ======================================================
// Mettre à jour une salle
// ======================================================
export const updateSalle = async (req, res) => {
  try {
    const salle = await Salle.findByPk(req.params.id);

    if (!salle) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }

    // Si le nom de salle est modifié, vérifier qu’il n’existe pas déjà
    if (req.body.nom_salle && req.body.nom_salle !== salle.nom_salle) {
      const salleExistante = await Salle.findOne({ where: { nom_salle: req.body.nom_salle } });
      if (salleExistante) {
        return res.status(400).json({
          success: false,
          message: 'Une salle avec ce nom existe déjà'
        });
      }
    }

    // ✅ Mise à jour
    await salle.update({
      ...req.body,
      updatedBy: req.user?.id || null
    });

    res.status(200).json({
      success: true,
      message: 'Salle mise à jour avec succès',
      data: salle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la salle',
      error: error.message
    });
  }
};

// ======================================================
// Supprimer une salle
// ======================================================
export const deleteSalle = async (req, res) => {
  try {
    const salle = await Salle.findByPk(req.params.id);

    if (!salle) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }

    // Vérifier s’il existe des séances associées à cette salle
    const seancesCount = await Seance.count({ where: { salle_id: req.params.id } });

    if (seancesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette salle car ${seancesCount} séance(s) y sont associées`
      });
    }

    await salle.destroy();

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
