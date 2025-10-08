// controllers/user/commande.controller.js
import Reservation from '../../models/reservation.model.js';
import Seance from '../../models/seance.model.js';
import Film from '../../models/film.model.js';
import Salle from '../../models/salle.model.js';
import Cinema from '../../models/cinema.model.js';

/**
 * Récupérer toutes les réservations de l'utilisateur
 */
export const getMesCommandes = async (req, res) => {
  try {
    const userId = req.user.id;

    const reservations = await Reservation.findAll({
      where: { utilisateur_id: userId },
      include: [
        {
          model: Seance,
          as: 'seance',
          attributes: ['id', 'date_heure'],
          include: [
            {
              model: Film,
              as: 'film',
              attributes: ['id', 'titre', 'affiche', 'date_sortie', 'duree'],
            },
            {
              model: Salle,
              as: 'salle',
              attributes: ['id', 'nom'],
              include: [
                {
                  model: Cinema,
                  as: 'cinema',
                  attributes: ['id', 'nom', 'ville'],
                },
              ],
            },
          ],
        },
      ],
      order: [['date_creation', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    console.error('Erreur getMesCommandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
};

/**
 * Récupérer une réservation spécifique
 */
export const getCommandeById = async (req, res) => {
  try {
    const userId = req.user.id;
    const reservationId = req.params.id;

    const reservation = await Reservation.findOne({
      where: { id: reservationId, utilisateur_id: userId },
      include: [
        {
          model: Seance,
          as: 'seance',
          attributes: ['id', 'date_heure'],
          include: [
            {
              model: Film,
              as: 'film',
              attributes: ['id', 'titre', 'affiche', 'date_sortie', 'duree'],
            },
            {
              model: Salle,
              as: 'salle',
              attributes: ['id', 'nom'],
              include: [
                {
                  model: Cinema,
                  as: 'cinema',
                  attributes: ['id', 'nom', 'ville'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    console.error('Erreur getCommandeById:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la réservation' });
  }
};
