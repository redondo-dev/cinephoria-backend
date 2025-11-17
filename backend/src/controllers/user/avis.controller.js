// controllers/user/avis.controller.js
import { 
  Avis, 
  Film, 
  Reservation, 
  Seance, 
  
} from '../../models/index.js';
import { Op } from 'sequelize';

/**
 * Créer un nouvel avis sur un film
 * POST /user/avis
 */
export const createAvis = async (req, res) => {
  try {
    const userId = req.user.id; // Vient du middleware authenticate
    const { film_id, note, contenu } = req.body;

    // Validation des données
    if (!film_id || !note || !contenu) {
      return res.status(400).json({ 
        message: 'Données manquantes (film_id, note, contenu requis)' 
      });
    }

    if (note < 1 || note > 5) {
      return res.status(400).json({ 
        message: 'La note doit être entre 1 et 5' 
      });
    }

    if (contenu.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Le commentaire doit contenir au moins 10 caractères' 
      });
    }

    // Vérifier que le film existe
    const film = await Film.findByPk(film_id);
    if (!film) {
      return res.status(404).json({ 
        message: 'Film non trouvé' 
      });
    }

    // Vérifier que l'utilisateur a bien assisté à une séance PASSÉE de ce film
    const seancePassee = await Reservation.findOne({
      where: { utilisateur_id: userId },
      include: [
        {
          model: Seance,
          as: 'seance',
          where: {
            film_id: film_id,
            date_heure_debut: {
              [Op.lt]: new Date() // Séance déjà passée
            }
          },
          required: true
        }
      ]
    });

    if (!seancePassee) {
      return res.status(403).json({ 
        message: 'Vous devez avoir assisté à une séance passée de ce film pour donner un avis' 
      });
    }

    // Vérifier si l'utilisateur a déjà donné un avis pour ce film
    const avisExistant = await Avis.findOne({
      where: {
        utilisateur_id: userId,
        film_id: film_id
      }
    });

    if (avisExistant) {
      return res.status(409).json({ 
        message: 'Vous avez déjà donné un avis pour ce film. Utilisez PUT /user/avis/:id pour le modifier.' 
      });
    }

    // Créer l'avis avec statut "en_attente"
    const nouvelAvis = await Avis.create({
      utilisateur_id: userId,
      film_id: film_id,
      note: note,
      contenu: contenu.trim(),
      date_avis: new Date(),
      statut_avis: 'en_attente' // En attente de validation par un employé
    });

    res.status(201).json({
      message: 'Avis créé avec succès. Il sera visible après validation par un employé.',
      avis: nouvelAvis
    });
  } catch (error) {
    console.error(' Erreur createAvis:', error);
    
    // Gérer la contrainte unique au cas où
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: 'Vous avez déjà donné un avis pour ce film' 
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur lors de la création de l\'avis',
      error: error.message 
    });
  }
};

/**
 * Récupérer tous les avis de l'utilisateur connecté
 * GET /user/avis
 */
export const getMesAvis = async (req, res) => {
  try {
    const userId = req.user.id;

    const avis = await Avis.findAll({
      where: { utilisateur_id: userId },
      include: [
        {
          model: Film,
          as: 'film',
          attributes: ['id', 'titre', 'affiche']
        }
      ],
      order: [['date_avis', 'DESC']]
    });

    res.json({
      count: avis.length,
      avis: avis
    });
  } catch (error) {
    console.error(' Erreur getMesAvis:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des avis',
      error: error.message 
    });
  }
};

/**
 * Récupérer l'avis de l'utilisateur pour un film donné
 * GET /user/avis/film/:filmId
 * Retourne null si aucun avis n'existe
 */
export const getAvisUtilisateur = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filmId } = req.params;

    // Validation du paramètre
    if (!filmId || isNaN(filmId)) {
      return res.status(400).json({ 
        message: 'ID de film invalide' 
      });
    }

    const avis = await Avis.findOne({
      where: {
        utilisateur_id: userId,
        film_id: parseInt(filmId)
      },
      include: [
        {
          model: Film,
          as: 'film',
          attributes: ['id', 'titre', 'affiche']
        }
      ]
    });

    // Retourner null si aucun avis trouvé (pas une erreur)
    res.json(avis);
  } catch (error) {
    console.error('Erreur getAvisUtilisateur:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération de l\'avis',
      error: error.message 
    });
  }
};

/**
 * Modifier un avis existant
 * PUT /user/avis/:id
 * Remet l'avis en "en_attente" après modification
 */
export const modifierAvis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { note, contenu } = req.body;

    // Validation du paramètre
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        message: 'ID d\'avis invalide' 
      });
    }

    // Validation des données
    if (!note && !contenu) {
      return res.status(400).json({ 
        message: 'Au moins un champ (note ou contenu) doit être fourni' 
      });
    }

    if (note && (note < 1 || note > 5)) {
      return res.status(400).json({ 
        message: 'La note doit être entre 1 et 5' 
      });
    }

    if (contenu && contenu.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Le commentaire doit contenir au moins 10 caractères' 
      });
    }

    // Vérifier que l'avis existe et appartient à l'utilisateur
    const avis = await Avis.findOne({
      where: {
        id: parseInt(id),
        utilisateur_id: userId
      }
    });

    if (!avis) {
      return res.status(404).json({ 
        message: 'Avis non trouvé ou vous n\'êtes pas autorisé à le modifier' 
      });
    }

    // Mettre à jour l'avis (remet en attente de validation)
    const updateData = {
      statut_avis: 'en_attente', // Remet en attente après modification
      date_avis: new Date()
    };

    if (note !== undefined) {
      updateData.note = note;
    }

    if (contenu !== undefined) {
      updateData.contenu = contenu.trim();
    }

    await avis.update(updateData);

    // Recharger l'avis avec les relations
    const avisUpdated = await Avis.findByPk(avis.id, {
      include: [
        {
          model: Film,
          as: 'film',
          attributes: ['id', 'titre', 'affiche']
        }
      ]
    });

    res.json({
      message: 'Avis modifié avec succès. Il sera visible après validation par un employé.',
      avis: avisUpdated
    });
  } catch (error) {
    console.error('❌ Erreur modifierAvis:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la modification de l\'avis',
      error: error.message 
    });
  }
};

/**
 * Récupérer la liste des films que l'utilisateur peut noter
 * GET /user/films-a-noter
 * Films avec séances passées et sans avis existant
 */
export const getFilmsANoter = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer tous les films des séances passées de l'utilisateur
    const reservations = await Reservation.findAll({
      where: { utilisateur_id: userId },
      include: [
        {
          model: Seance,
          as: 'seance',
          where: {
            date_heure_debut: {
              [Op.lt]: new Date() // Séance passée
            }
          },
          required: true,
          include: [
            {
              model: Film,
              as: 'film',
              attributes: ['id', 'titre', 'affiche']
            }
          ]
        }
      ]
    });

    // Extraire les films uniques
    const filmsVus = new Map();
    reservations.forEach(reservation => {
      const film = reservation.seance.film;
      if (film && !filmsVus.has(film.id)) {
        filmsVus.set(film.id, {
          id: film.id,
          titre: film.titre,
          affiche: film.affiche,
          date_derniere_seance: reservation.seance.date_heure_debut
        });
      }
    });

    // Récupérer les avis déjà donnés par l'utilisateur
    const avisExistants = await Avis.findAll({
      where: { 
        utilisateur_id: userId,
        film_id: {
          [Op.in]: Array.from(filmsVus.keys())
        }
      },
      attributes: ['film_id']
    });

    // Retirer les films déjà notés
    const filmIdsAvecAvis = new Set(avisExistants.map(a => a.film_id));
    const filmsANoter = Array.from(filmsVus.values())
      .filter(film => !filmIdsAvecAvis.has(film.id))
      .sort((a, b) => new Date(b.date_derniere_seance) - new Date(a.date_derniere_seance));

    res.json({
      count: filmsANoter.length,
      films: filmsANoter
    });
  } catch (error) {
    console.error(' Erreur getFilmsANoter:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des films à noter',
      error: error.message 
    });
  }
};