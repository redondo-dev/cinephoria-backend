// routes/public/public.seances.routes.js
import { Router } from 'express';
import {
  getAvailableDates,
  getSeancesByFilm,
  getAllSeances,
  getSeanceById
} from '../../controllers/public/seance/seance.controller.js';

const router = Router();

/**
 * @swagger
 * /api/seances/dates:
 *   get:
 *     summary: Récupère toutes les dates disponibles pour les séances
 *     tags: [Seances Publiques]
 *     responses:
 *       200:
 *         description: Liste des dates disponibles
 */
router.get('/dates', getAvailableDates);

/**
 * @swagger
 * /api/seances/film/{filmId}:
 *   get:
 *     summary: Récupère toutes les séances d'un film spécifique
 *     tags: [Seances Publiques]
 *     parameters:
 *       - in: path
 *         name: filmId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du film
 *     responses:
 *       200:
 *         description: Liste des séances du film
 */
router.get('/film/:filmId', getSeancesByFilm);

/**
 * @swagger
 * /api/seances/{id}:
 *   get:
 *     summary: Récupère une séance par son ID
 *     tags: [Seances Publiques]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la séance
 *     responses:
 *       200:
 *         description: Détails de la séance
 *       404:
 *         description: Séance non trouvée
 */
router.get('/:id', getSeanceById);

/**
 * @swagger
 * /api/seances:
 *   get:
 *     summary: Récupère toutes les séances disponibles (avec filtres optionnels)
 *     tags: [Seances Publiques]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrer par date (YYYY-MM-DD)
 *       - in: query
 *         name: cinemaId
 *         schema:
 *           type: integer
 *         description: Filtrer par cinéma
 *       - in: query
 *         name: filmId
 *         schema:
 *           type: integer
 *         description: Filtrer par film
 *     responses:
 *       200:
 *         description: Liste des séances
 */
router.get('/', getAllSeances);

/**
 * @swagger
 * /api/seances/test-dates:
 *   get:
 *     summary: Route de test pour les dates
 *     tags: [Seances Publiques]
 *     responses:
 *       200:
 *         description: Dates de test
 */
router.get('/test-dates', (req, res) => {
  const testDates = [
    '2024-01-15',
    '2024-01-16', 
        '2024-01-17'
  ];
  res.json(testDates);
});

export default router;