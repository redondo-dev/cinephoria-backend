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
      attributes: ['dateHeureDebut'],
      where: {
        dateHeureDebut: { [Op.gte]: new Date() }
      },
      order: [['dateHeureDebut', 'ASC']],
      raw: true
    });

    if (seances.length === 0) {
      return res.status(200).json([]);
    }

    const dateSet = new Set();
    seances.forEach((s) => {
      if (s.dateHeureDebut) {
        dateSet.add(new Date(s.dateHeureDebut).toISOString().split('T')[0]);
      }
    });

    res.status(200).json(Array.from(dateSet).sort());
  } catch (error) {
    console.error('Erreur getAvailableDates:', error.message);
    res.status(500).json({ success: false, message: 'Erreur dates', error: error.message });
  }
};

// Mapping centralisé qualité de projection -> mot-clé de recherche dans le nom du tarif.
// Couvre les 6 valeurs réellement validées côté salle.controller.js.
const MOTS_CLES_QUALITE = {
  '2D': '2d',
  '3D': '3d',
  'IMAX': 'imax',
  '4DX': '4dx',
  'Dolby Cinema': 'dolby',
  'ScreenX': 'screenx',
};

function getPrixByQualite(tarifs, qualite, type = 'normal') {
  const motCle = MOTS_CLES_QUALITE[qualite];
  const tarif = motCle
    ? tarifs.find((t) => t.type_tarif === type && t.nom_tarif.toLowerCase().includes(motCle))
    : null;
  return tarif?.prix_unitaire ?? 9.5;
}

/**
 * Récupère les séances d'un film spécifique
 * GET /api/seances/film/:filmId
 */
export const getSeancesByFilm = async (req, res) => {
  try {
    const { filmId } = req.params;

    const seances = await Seance.findAll({
      where: {
        filmId,
        dateHeureDebut: { [Op.gte]: new Date() }
      },
      include: [
        {
          model: Salle,
          as: 'salle',
          attributes: ['id', ['nom_salle', 'nom_salle'], ['capacite', 'capacite'], ['qualite_projection', 'qualite_projection']],
          include: [
            { model: Cinema, as: 'cinema', attributes: ['id', 'nom', 'ville', 'adresse'] }
          ]
        },
        { model: Film, as: 'film', attributes: ['id', 'titre'] }
      ],
      order: [['dateHeureDebut', 'ASC']]
    });

    const tarifs = await Tarif.findAll({
      attributes: ['id', 'nom_tarif', 'type_tarif', 'prix_unitaire']
    });

    const formattedSeances = seances.map((seance) => {
      const qualite = seance.salle?.dataValues?.qualite_projection || 'Standard';

      return {
        id: seance.id,
        date: seance.dateHeureDebut.toISOString().split('T')[0],
        heure_debut: seance.dateHeureDebut.toISOString().substring(11, 16),
        heure_fin: seance.dateHeureFin.toISOString().substring(11, 16),
        qualite,
        prix: parseFloat(getPrixByQualite(tarifs, qualite)),
        places_disponibles: seance.salle?.dataValues?.capacite || 0,
        salle: seance.salle?.dataValues?.nom_salle || 'N/A',
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
      dateHeureDebut: { [Op.gte]: new Date() }
    };

    if (date) {
      whereClause.dateHeureDebut = {
        [Op.gte]: new Date(`${date}T00:00:00`),
        [Op.lt]: new Date(`${date}T23:59:59`)
      };
    }

    if (filmId) {
      whereClause.filmId = filmId;
    }

    const includeClause = [
      {
        model: Salle,
        as: 'salle',
        attributes: ['id', ['nom_salle', 'nom_salle'], ['capacite', 'capacite'], ['qualite_projection', 'qualite_projection']],
        include: [
          { model: Cinema, as: 'cinema', attributes: ['id', 'nom', 'ville'] }
        ]
      },
      { model: Film, as: 'film', attributes: ['id', 'titre', 'affiche'] }
    ];

    if (cinemaId) {
      includeClause[0].include[0].where = { id: cinemaId };
    }

    const seances = await Seance.findAll({
      where: whereClause,
      include: includeClause,
      order: [['dateHeureDebut', 'ASC']]
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
          include: [{ model: Cinema, as: 'cinema' }]
        },
        { model: Film, as: 'film' }
      ]
    });

    if (!seance) {
      return res.status(404).json({ success: false, message: 'Séance non trouvée' });
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