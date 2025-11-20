// controllers/public/seance/seance.controller.js
import Seance from '../../../models/seance.model.js';
import Salle from '../../../models/salle.model.js';
import Cinema from '../../../models/cinema.model.js';
import Film from '../../../models/film.model.js';
import Tarif from '../../../models/tarif.model.js';
import { Op } from 'sequelize';

/**
 * Récupère toutes les dates disponibles pour les séances
 * GET /api/seances/dates
 */
export const getAvailableDates = async (req, res) => {
  try {
    const seances = await Seance.findAll({
      attributes: ['date_seance'],
      where: {
        date_seance: {
          [Op.gte]: new Date() 
        }
      },
      group: ['date_seance'],
      order: [['date_seance', 'ASC']],
      raw: true
    });
    console.log('Séances trouvées:', seances); // Debug

 // Si pas de séances, retourner des dates de test
if (seances.length === 0) {
  const testDates = [
    '2024-01-15',
    '2024-01-16', 
    '2024-01-17',
    '2024-01-18'
  ];
  console.log('Retour des dates de test:', testDates);
  return res.status(200).json(testDates);
}
 // Formater et dédupliquer les dates
const dateSet = new Set();
seances.forEach(s => {
  if (s.date_seance) {
    const date = new Date(s.date_seance);
    const formattedDate = date.toISOString().split('T')[0];
    dateSet.add(formattedDate);
  }
});
const dates = Array.from(dateSet).sort();
    console.log('Dates disponibles:', dates); // Pour debug

    
res.status(200).json(dates);
  } catch (error) {
    console.error('Erreur getAvailableDates:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dates',
      error: error.message
    });
  }
};

/**
 * Récupère les séances d'un film spécifique
 * GET /api/seances/film/:filmId
 */
export const getSeancesByFilm = async (req, res) => {
  try {
    const { filmId } = req.params;

    const seances = await Seance.findAll({
      
      where: {
        film_id: filmId,
        dateHeureDebut: {
          [Op.gte]: new Date() // Seulement les séances futures
        }
      },
      include: [
        {
          model: Salle,
          as: 'salle',
          attributes: ['id', 'nom_salle', 'capacite', 'qualite_projection'],
          include: [
            {
              model: Cinema,
              as: 'cinema',
              attributes: ['id', 'nom', 'ville', 'adresse']
            }
          ]
        },
        {
          model: Film,
          as: 'film',
          attributes: ['id', 'titre']
        }
      ],
      order: [
        ['date_seance', 'ASC'],
        ['dateHeureDebut', 'ASC']
      ]
    });

    // Récupérer les tarifs pour calculer les prix
    const tarifs = await Tarif.findAll({
      attributes: ['id', 'nom_tarif', 'type_tarif', 'prix_unitaire']
    });

    // Mapper les prix selon la qualité de projection
    const getPrixByQualite = (qualite, type = 'normal') => {
      const mapping = {
        'Standard': tarifs.find(t => t.type_tarif === type && t.nom_tarif.toLowerCase().includes('standard')),
        '3D': tarifs.find(t => t.type_tarif === type && t.nom_tarif.toLowerCase().includes('3d')),
        'IMAX': tarifs.find(t => t.type_tarif === type && t.nom_tarif.toLowerCase().includes('imax')),
        'VIP': tarifs.find(t => t.type_tarif === type && t.nom_tarif.toLowerCase().includes('vip'))
      };
      return mapping[qualite]?.prix_unitaire || 9.50;
    };

    // Formater les séances avec les infos nécessaires
    const formattedSeances = seances.map(seance => {
      const qualite = seance.salle?.qualite_projection || 'Standard';
      
      return {
        id: seance.id,
        date: seance.date_seance,
        heure_debut: seance.dateHeureDebut.toISOString().substring(11, 16),
        heure_fin: seance.dateHeureFin.toISOString().substring(11, 16),
        qualite: qualite,
        prix: parseFloat(getPrixByQualite(qualite)),
        places_disponibles: seance.salle?.capacite || 0,
        salle: seance.salle?.nom_salle || 'N/A',
        cinema: seance.salle?.cinema?.nom || 'N/A',
        cinema_ville: seance.salle?.cinema?.ville || 'N/A'
      };
    });

    res.status(200).json(formattedSeances);
  } catch (error) {
    console.error('Erreur getSeancesByFilm:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des séances',
      error: error.message
    });
  }
};

/**
 * Récupère toutes les séances disponibles (avec filtres optionnels)
 * GET /api/seances
 */
export const getAllSeances = async (req, res) => {
  try {
    const { date, cinemaId, filmId } = req.query;

    const whereClause = {
      date_seance: {
        [Op.gte]: new Date()
      }
    };

    if (date) {
      whereClause.date_seance = date;
    }

    if (filmId) {
      whereClause.filmId = filmId;
    }

    const includeClause = [
      {
        model: Salle,
        as: 'salle',
        attributes: ['id', 'nom_salle', 'capacite', 'qualite_projection'],
        include: [
          {
            model: Cinema,
            as: 'cinema',
            attributes: ['id', 'nom', 'ville']
          }
        ]
      },
      {
        model: Film,
        as: 'film',
        attributes: ['id', 'titre', 'affiche']
      }
    ];

    // Filtrer par cinéma si spécifié
    if (cinemaId) {
      includeClause[0].include[0].where = { id: cinemaId };
    }

    const seances = await Seance.findAll({
      where: whereClause,
      include: includeClause,
      order: [
        ['date_seance', 'ASC'],
        ['dateHeureDebut', 'ASC']
      ]
    });

    res.status(200).json(seances);
  } catch (error) {
    console.error('Erreur getAllSeances:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des séances',
      error: error.message
    });
  }
};

/**
 * Récupère une séance par ID
 * GET /api/seances/:id
 */
export const getSeanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const seance = await Seance.findByPk(id, {
      include: [
        {
          model: Salle,
          as: 'salle',
          include: [
            {
              model: Cinema,
              as: 'cinema'
            }
          ]
        },
        {
          model: Film,
          as: 'film'
        }
      ]
    });

    if (!seance) {
      return res.status(404).json({
        success: false,
        message: 'Séance non trouvée'
      });
    }

    res.status(200).json(seance);
  } catch (error) {
    console.error('Erreur getSeanceById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la séance',
      error: error.message
    });
  }
};