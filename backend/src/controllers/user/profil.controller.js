import User from '../../models/user.model.js';
import Role from '../../models/role.model.js';
import Reservation from '../../models/reservation.model.js';
import Seance from '../../models/seance.model.js';
import Film from '../../models/film.model.js';
import Avis from '../../models/avis.model.js';


// Récupérer le profil complet de l'utilisateur connecté
//  GET /api/user/profile


export const getProfile = async (req, res) => {
  try {
    // Ajout du "await" manquant et vérification du user connecté
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'nom', 'prenom', 'username', 'email'],
      include: [
        {
          model: Role,
          as: 'roleDetails',
          attributes: ['nom_role'],
        },
        {
          model: Reservation,
          as: 'reservations', //
          include: [
            {
              model: Seance,
              as: 'seance',
              include: [
                {
                  model: Film,
                  as: 'film',
                  attributes: ['titre'],
                },
              ],
            },
          ],
        },
        {
          model: Avis,
          as: 'avisEcrits',
          include: [
            {
              model: Film,
              as: 'film',
              attributes: ['titre'],
            },
          ],
        },
      ],
    });

    // Vérification si l’utilisateur existe
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Réponse
    return res.status(200).json({
      success: true,
      message: 'Profil récupéré avec succès',
      data: user,
    });
  } catch (error) {
    console.error('Erreur profil :', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du profil",
      error: error.message,
    });
  }
};
