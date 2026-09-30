// controllers/public/film.controller.js
import Film from '../../../models/film.model.js';
import Seance from '../../../models/seance.model.js';
import Salle from '../../../models/salle.model.js';
import Cinema from '../../../models/cinema.model.js';
import Genre from '../../../models/genre.model.js';
import { Op } from 'sequelize';

// Récupérer tous les films (route publique)

// Calcule la date du dernier mercredi (aujourd'hui inclus si on est mercredi).
// US2 : "tous les films sont ajoutes par un employe ou un administrateur
// uniquement le mercredi. La page d'accueil doit afficher [...] tous les films
// ajoutes le dernier mercredi."
function getDernierMercredi() {
  const aujourdhui = new Date();
  const jourSemaine = aujourdhui.getUTCDay(); // 0=dimanche, 3=mercredi
  const diffJours = (jourSemaine - 3 + 7) % 7;
  const dernierMercredi = new Date(aujourdhui);
  dernierMercredi.setUTCDate(aujourdhui.getUTCDate() - diffJours);
  dernierMercredi.setUTCHours(0, 0, 0, 0);
  return dernierMercredi;
}
export const getAllFilmsPublic = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { genre, search, coup_coeur, cinema, date, sort } = req.query;

    // Tri : appliqué côté serveur pour porter sur l'ENSEMBLE des résultats filtrés,
    const ordresValides = {
      recent: [['date_ajout', 'DESC']],
      rating: [['note_moyenne', 'DESC']],
    };
    const order = ordresValides[sort] || ordresValides.recent;

    const where = {};

    // US2 : si recent=true, ne montrer que les films ajoutes le dernier mercredi
    if (req.query.recent === 'true') {
      const dernierMercredi = getDernierMercredi();
      const finDernierMercredi = new Date(dernierMercredi);
      finDernierMercredi.setUTCHours(23, 59, 59, 999);
      where.date_ajout = { [Op.between]: [dernierMercredi, finDernierMercredi] };
    }
    if (coup_coeur) where.coup_coeur = true;
    if (search) where.titre = { [Op.iLike]: `%${search}%` };

    // Filtres "Cinéma" et "Jour" (US5) : résolus en deux temps, via une sous-requête
    // séparée sur Seance→Salle→Cinema, pour éviter le bug Sequelize "deux hasMany + limit"
   
    if (cinema || date) {
      const seanceWhere = {};
      if (date) {
        const debutJour = new Date(`${date}T00:00:00.000Z`);
        const finJour = new Date(`${date}T23:59:59.999Z`);
        seanceWhere.dateHeureDebut = { [Op.between]: [debutJour, finJour] };
      }

      const seancesCorrespondantes = await Seance.findAll({
        attributes: ['filmId'],
        where: seanceWhere,
        include: [
          {
            model: Salle,
            as: 'salle',
            attributes: [],
            required: true,
            where: cinema ? { cinema_id: cinema } : undefined,
          },
        ],
        raw: true,
      });

      const filmIds = [...new Set(seancesCorrespondantes.map((s) => s.filmId))];

      if (filmIds.length === 0) {
        return res.status(200).json({ films: [], total: 0, page, totalPages: 0 });
      }
      where.id = { [Op.in]: filmIds };
    }

    const { count, rows: films } = await Film.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
      include: [
        {
          model: Genre,
          as: 'genres',
          attributes: ['id', 'nom'],
          through: { attributes: [] },
          ...(genre ? { where: { id: genre } } : {}),
          required: !!genre,
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