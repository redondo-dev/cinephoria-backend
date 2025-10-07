// controllers/employee/avis.controller.js
import { Avis, User, Film } from '../../models/index.js';
import { Op } from 'sequelize';

//  Récupérer tous les avis
export const getAllAvis = async (req, res) => {
  try {
    const { filmId, statut, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (filmId) filter.film_id = filmId;
    if (statut) filter.statut_avis = statut;

    const offset = (page - 1) * limit;

    const { count, rows: avis } = await Avis.findAndCountAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Film,
          as: 'film',
          attributes: ['id', 'titre', 'affiche']
        }
      ],
      order: [['date_avis', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      total: count,
      count: avis.length,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: avis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: error.message
    });
  }
};

// Récupérer les avis en attente
export const getAvisEnAttente = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: avis } = await Avis.findAndCountAll({
      where: { statut_avis: 'en_attente' },
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Film,
          as: 'film',
          attributes: ['id', 'titre', 'affiche']
        }
      ],
      order: [['date_avis', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      total: count,
      count: avis.length,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: avis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis en attente',
      error: error.message
    });
  }
};

// Valider un avis
export const validerAvis = async (req, res) => {
  try {
    const avis = await Avis.findByPk(req.params.id);

    if (!avis) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    if (avis.statut_avis !== 'en_attente') {
      return res.status(400).json({
        success: false,
        message: `Cet avis a déjà été ${avis.statut_avis === 'valide' ? 'validé' : 'rejeté'}.`
      });
    }

    avis.statut_avis = 'valide';
    avis.motif_refus = req.user.id; // Employé validateur
    avis.date_validation = new Date();
    await avis.save();

    // Met à jour la note moyenne du film
    await updateFilmRating(avis.film_id);

    // Recharger avec les relations
    await avis.reload({
      include: [
        { model: User, as: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'email'] },
        { model: Film, as: 'film', attributes: ['id', 'titre', 'affiche'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Avis validé avec succès',
      data: avis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de l\'avis',
      error: error.message
    });
  }
};

// 🗑 Supprimer un avis
export const deleteAvis = async (req, res) => {
  try {
    const avis = await Avis.findByPk(req.params.id);
    if (!avis) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    const filmId = avis.film_id;
    const wasValidated = avis.statut_avis === 'valide';

    await avis.destroy();

    if (wasValidated) {
      await updateFilmRating(filmId);
    }

    res.status(200).json({
      success: true,
      message: 'Avis supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'avis',
      error: error.message
    });
  }
};

//  Mise à jour de la note moyenne du film
async function updateFilmRating(filmId) {
  try {
    const [result] = await Avis.findAll({
      where: { film_id: filmId, statut_avis: 'valide' },
      attributes: [
        [Avis.sequelize.fn('AVG', Avis.sequelize.col('note')), 'noteMoyenne'],
        [Avis.sequelize.fn('COUNT', Avis.sequelize.col('id')), 'nombreAvis']
      ],
      raw: true
    });

    const moyenne = parseFloat(result.noteMoyenne) || 0;
    const nbAvis = parseInt(result.nombreAvis) || 0;

    await Film.update(
      {
        note_moyenne: Math.round(moyenne * 10) / 10,
        nombre_avis: nbAvis
      },
      { where: { id: filmId } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note du film:', error);
  }
}
