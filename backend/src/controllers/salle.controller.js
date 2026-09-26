// controllers/salle.controller.js
// Contrôleur UNIQUE pour la gestion des salles, partagé par les routes /api/admin et /api/employee.


import Salle from '../models/salle.model.js';
import Seance from '../models/seance.model.js';


export const QUALITES_PROJECTION_VALIDES = [
  'Standard', 'IMAX', '2D', '3D', '4DX', 'Dolby Atmos', 'ScreenX'
];

// ======================================================
// Récupérer toutes les salles
// ======================================================
export const getAllSalles = async (req, res) => {
  try {
    const salles = await Salle.findAll({
      attributes: [
        'id',
        ['nom_salle', 'nom'],
        ['capacite', 'nombrePlaces'],
        ['qualite_projection', 'qualiteProjection'],
        'cinema_id',
      ],
      order: [['id', 'ASC']],
    });
    res.status(200).json({ success: true, count: salles.length, data: salles });
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
    const salle = await Salle.findByPk(req.params.id, {
      attributes: [
        'id',
        ['nom_salle', 'nom'],
        ['capacite', 'nombrePlaces'],
        ['qualite_projection', 'qualiteProjection'],
        'cinema_id',
      ],
    });
    if (!salle) {
      return res.status(404).json({ success: false, message: 'Salle non trouvée' });
    }
    res.status(200).json({ success: true, data: salle });
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
    // Correction : le formulaire envoie nom/nombrePlaces/qualiteProjection en camelCase
    // (interface Salle côté frontend), pas nom_salle/capacite/qualite_projection —
    // même bug corrigé sur updateSalle juste en dessous. On accepte les deux formes.
    const nom = req.body.nom ?? req.body.nom_salle;
    const nombrePlaces = req.body.nombrePlaces ?? req.body.capacite;
    const qualiteProjection = req.body.qualiteProjection ?? req.body.qualite_projection;
    const cinema_id = req.body.cinema_id;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom de la salle est obligatoire' });
    }
    if (!cinema_id) {
      return res.status(400).json({ success: false, message: "L'identifiant du cinéma est obligatoire" });
    }
    if (!nombrePlaces || nombrePlaces < 1 || nombrePlaces > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre de places doit être entre 1 et 1000'
      });
    }
    if (qualiteProjection && !QUALITES_PROJECTION_VALIDES.includes(qualiteProjection)) {
      return res.status(400).json({
        success: false,
        message: `Qualité de projection invalide. Valeurs acceptées : ${QUALITES_PROJECTION_VALIDES.join(', ')}`
      });
    }

    const salleExistante = await Salle.findOne({ where: { nom: nom.trim() } });
    if (salleExistante) {
      return res.status(400).json({ success: false, message: 'Une salle avec ce nom existe déjà' });
    }

    const newSalle = await Salle.create({
      nom: nom.trim(),
      nombrePlaces: Number(nombrePlaces),
      cinema_id: Number(cinema_id),
      qualiteProjection,
    });

    res.status(201).json({
      success: true,
      message: 'Salle créée avec succès',
      data: {
        id: newSalle.id,
        // Clés alignées sur l'interface Salle du frontend (AdminService).
        nom: newSalle.nom,
        nombrePlaces: newSalle.nombrePlaces,
        qualiteProjection: newSalle.qualiteProjection,
        cinema_id: newSalle.cinema_id,
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(', ')
      });
    }
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
      return res.status(404).json({ success: false, message: 'Salle non trouvée' });
    }

  
    const nom = req.body.nom ?? req.body.nom_salle;
    const nombrePlaces = req.body.nombrePlaces ?? req.body.capacite;
    const qualiteProjection = req.body.qualiteProjection ?? req.body.qualite_projection;
    const cinema_id = req.body.cinema_id;

    if (nom && nom.trim() !== salle.nom) {
      const salleExistante = await Salle.findOne({ where: { nom: nom.trim() } });
      if (salleExistante) {
        return res.status(400).json({ success: false, message: 'Une salle avec ce nom existe déjà' });
      }
    }
    if (qualiteProjection && !QUALITES_PROJECTION_VALIDES.includes(qualiteProjection)) {
      return res.status(400).json({
        success: false,
        message: `Qualité de projection invalide. Valeurs acceptées : ${QUALITES_PROJECTION_VALIDES.join(', ')}`
      });
    }
    if (nombrePlaces !== undefined && (nombrePlaces < 1 || nombrePlaces > 1000)) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre de places doit être entre 1 et 1000'
      });
    }

    await salle.update({
      ...(nom && { nom: nom.trim() }),
      ...(nombrePlaces !== undefined && { nombrePlaces: Number(nombrePlaces) }),
      ...(qualiteProjection && { qualiteProjection }),
      ...(cinema_id && { cinema_id: Number(cinema_id) }),
    });

    res.status(200).json({
      success: true,
      message: 'Salle mise à jour avec succès',
      data: {
        id: salle.id,
        nom: salle.nom,
        nombrePlaces: salle.nombrePlaces,
        qualiteProjection: salle.qualiteProjection,
        cinema_id: salle.cinema_id,
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(', ')
      });
    }
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
      return res.status(404).json({ success: false, message: 'Salle non trouvée' });
    }

    // Vérification conservée de la version employé : la version admin supprimait sans contrôle,
    // avec un risque d'orphelins ou d'erreur de contrainte selon la configuration de la FK.
    const seancesCount = await Seance.count({ where: { salle_id: req.params.id } });
    if (seancesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette salle car ${seancesCount} séance(s) y sont associées`
      });
    }

    await salle.destroy();
    res.status(200).json({ success: true, message: 'Salle supprimée avec succès' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la salle',
      error: error.message
    });
  }
};