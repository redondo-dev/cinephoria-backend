
import { Router } from 'express';
import Film from '../../models/film.model.js';
import { getAllFilmsPublic, getFilmByIdPublic } from '../../controllers/public/film/film.controller.js';


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
router.get('/',getAllFilmsPublic )


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
router.get('/:id',getFilmByIdPublic )
  

export default router;