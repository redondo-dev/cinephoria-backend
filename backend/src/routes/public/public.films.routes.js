
import { Router } from 'express';
import Film from '../../models/film.model.js';

const router = Router();

/**
 * @swagger
 * /api/films:
 *   get:
 *     summary: Récupère tous les films (route publique)
 *     tags: [Films Publics]
 *     responses:
 *       200:
 *         description: Liste des films
 */
router.get('/', async (req, res) => {
  try {
    const films = await Film.findAll({
      order: [["date_ajout", "DESC"]]
    });
    
    res.status(200).json(films);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des films',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/films/{id}:
 *   get:
 *     summary: Récupère un film par son ID (route publique)
 *     tags: [Films Publics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du film
 *     responses:
 *       200:
 *         description: Film trouvé
 *       404:
 *         description: Film non trouvé
 */
router.get('/:id', async (req, res) => {
  try {
    const film = await Film.findByPk(req.params.id);
    
    if (!film) {
      return res.status(404).json({
        success: false,
        message: 'Film non trouvé'
      });
    }

    res.status(200).json(film);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du film',
      error: error.message
    });
  }
});

export default router;