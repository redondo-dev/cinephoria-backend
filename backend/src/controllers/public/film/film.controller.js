// controllers/public/film.controller.js
import Film from '../../../models/film.model.js';
import Seance from '../../../models/seance.model.js';
import Salle from '../../../models/salle.model.js';
import Cinema from '../../../models/cinema.model.js';
import Genre from '../../../models/genre.model.js'; // ✅ ajout
import { Op } from 'sequelize'; // ✅ ajout pour le filtre search

// Récupérer tous les films (route publique)
export const getAllFilmsPublic = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { genre, search, coup_coeur } = req.query;

    const where = {};
    if (coup_coeur) where.coup_coeur = true;
    if (search) where.titre = { [Op.iLike]: `%${search}%` };

    const { count, rows: films } = await Film.findAndCountAll({
      where,
      limit,
      offset,
      order: [['date_ajout', 'DESC']],
      distinct: true, // ✅ important avec les includes
      include: [
        {
          model: Genre,
          as: 'genres',
          attributes: ['id', 'nom'],
          through: { attributes: [] },
          ...(genre ? { where: { id: genre } } : {}),
          required: !!genre,
        },
        {
          model: Seance,
          as: 'seances',
          required: false,
          attributes: ['id', 'filmId', 'salleId', 'dateHeureDebut', 'dateHeureFin'],
          include: [
            {
              model: Salle,
              as: 'salle',
              required: false,
              include: [
                {
                  model: Cinema,
                  as: 'cinema',
                  attributes: ['id', 'nom', 'ville'],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      films,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });

  } catch (error) {
    console.error('Erreur getAllFilmsPublic:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des films',
      error: error.message,
    });
  }
};

// Récupérer un film par ID (route publique)
export const getFilmByIdPublic = async (req, res) => {
  try {
    const film = await Film.findByPk(req.params.id, {
      include: [
        {
          model: Genre,
          as: 'genres',
          attributes: ['id', 'nom'],
          through: { attributes: [] },
        },
        {
          model: Seance,
          as: 'seances',
          required: false,
          attributes: ['id', 'filmId', 'salleId', 'dateHeureDebut', 'dateHeureFin'],
          include: [
            {
              model: Salle,
              as: 'salle',
              required: false,
              include: [
                {
                  model: Cinema,
                  as: 'cinema',
                  attributes: ['id', 'nom', 'ville'],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé' });
    }

    res.status(200).json(film);

  } catch (error) {
    console.error('Erreur getFilmByIdPublic:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du film',
      error: error.message,
    });
  }
};