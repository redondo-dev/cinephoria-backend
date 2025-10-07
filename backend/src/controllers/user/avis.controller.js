// controllers/user/avisController.js
import Avis from '../../models/Avis.js';
import Commande from '../../models/Commande.js';

/**
 * Créer un avis pour un film
 */
export const createAvis = async (req, res) => {
  try {
    const { filmId, note, commentaire } = req.body;

    // Vérifier que l'utilisateur a bien assisté à une séance de ce film
    const commandes = await Commande.find({ userId: req.user._id })
      .populate({
        path: 'reservations',
        populate: { path: 'seanceId' }
      });

    let aPuVoirLeFilm = false;

    for (const commande of commandes) {
      for (const reservation of commande.reservations) {
        if (reservation.seanceId.filmId.toString() === filmId) {
          // Vérifier que la date de la séance est dépassée
          if (new Date(reservation.seanceId.dateHeure) < new Date()) {
            aPuVoirLeFilm = true;
            break;
          }
        }
      }
      if (aPuVoirLeFilm) break;
    }

    if (!aPuVoirLeFilm) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez noter que les films dont la séance est passée.'
      });
    }

    // Vérifier si l'utilisateur a déjà noté ce film
    const avisExistant = await Avis.findOne({
      filmId,
      userId: req.user._id
    });

    if (avisExistant) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà noté ce film.'
      });
    }

    // Créer l'avis
    const avis = new Avis({
      filmId,
      userId: req.user._id,
      note,
      commentaire,
      statut: 'en_attente'
    });

    await avis.save();

    res.status(201).json({
      success: true,
      message: 'Avis soumis avec succès. Il sera visible après validation.',
      data: avis
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Récupérer les avis de l'utilisateur connecté
 */
export const getMesAvis = async (req, res) => {
  try {
    const avis = await Avis.find({ userId: req.user._id })
      .populate('filmId', 'titre affiche_url')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: avis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};