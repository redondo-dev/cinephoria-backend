// controllers/employee/intranet.controller.js

// Récupérer les données du dashboard intranet
export const getDashboard = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Bienvenue dans l\'espace Intranet Employé',
      data: {
        user: {
          id: req.user.id,
          nom: req.user.nom,
          prenom: req.user.prenom,
          email: req.user.email,
          role: req.user.roleDetails?.nom || 'Employé'
        },
        accesDisponibles: [
          'Gestion des films (créer, modifier, supprimer)',
          'Gestion des salles (créer, modifier, supprimer)',
          'Gestion des séances (créer, modifier, supprimer)',
          'Modération des avis (valider, supprimer)'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'accès au dashboard',
      error: error.message
    });
  }
};