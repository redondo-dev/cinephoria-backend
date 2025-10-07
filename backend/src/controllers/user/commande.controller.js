// controllers/user/commande.controller.js
import Commande from '../../models/commande.model.js';


/**
 * Récupérer toutes les commandes de l'utilisateur connecté
 */
export const getMesCommandes = async (req, res) => {
  try {
    const commandes = await Commande.find({ userId: req.user._id })
      .populate({
        path: 'reservations',
        populate: {
          path: 'seanceId',
          populate: [
            { path: 'filmId', select: 'titre affiche_url duree' },
            { path: 'salleId', select: 'nom qualiteProjection' }
          ]
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: commandes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Récupérer une commande spécifique
 */
export const getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate({
      path: 'reservations',
      populate: {
        path: 'seanceId',
        populate: [
          { path: 'filmId', select: 'titre affiche_url duree' },
          { path: 'salleId', select: 'nom qualiteProjection' }
        ]
      }
    });

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    res.json({
      success: true,
      data: commande
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};