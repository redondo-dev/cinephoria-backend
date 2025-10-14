// routes/employee.js
import { Router } from 'express';
const router = Router();
import { verifyToken, authorizeRoles } from '../middleware/auth.middleware.js';


import { getAllFilms, createFilm, getFilmById, updateFilm, deleteFilm } from '../controllers/employee/film.controller.js';
import { getAllSalles, createSalle, getSalleById, updateSalle, deleteSalle } from '../controllers/employee/salle.controller.js';
import { getAllSeances, createSeance, getSeanceById, updateSeance, deleteSeance } from '../controllers/employee/seance.controller.js';
import { getAllAvis, getAvisEnAttente, validerAvis, deleteAvis } from '../controllers/employee/avis.controller.js';
import { getDashboard } from '../controllers/employee/intranet.controller.js';

// Appliquer les middlewares d'authentification
router.use(verifyToken);
router.use(authorizeRoles('employee', 'admin'));

// Routes Films
router.get('/films', getAllFilms);
router.post('/films', createFilm);
router.get('/films/:id', getFilmById);
router.put('/films/:id', updateFilm);
router.delete('/films/:id', deleteFilm);

// Routes Salles
router.get('/salles', getAllSalles);
router.post('/salles', createSalle);
router.get('/salles/:id', getSalleById);
router.put('/salles/:id', updateSalle);
router.delete('/salles/:id', deleteSalle);

// Routes Séances
router.get('/seances', getAllSeances);
router.post('/seances', createSeance);
router.get('/seances/:id', getSeanceById);
router.put('/seances/:id', updateSeance);
router.delete('/seances/:id', deleteSeance);

// Routes Avis
router.get('/avis', getAllAvis);
router.get('/avis/en-attente', getAvisEnAttente);
router.patch('/avis/:id/valider', validerAvis);
router.delete('/avis/:id', deleteAvis);

// Dashboard
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * tags:
 *   - name: Employés
 *     description: Routes accessibles aux employés et administrateurs (films, salles, séances, avis, dashboard)
 */

/* ============================= FILMS ============================= */

/**
 * @swagger
 * /employee/films:
 *   get:
 *     summary: Récupère tous les films
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de tous les films
 */
router.get("/films", getAllFilms);

/**
 * @swagger
 * /employee/films:
 *   post:
 *     summary: Crée un nouveau film
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *                 example: "Inception"
 *               description:
 *                 type: string
 *                 example: "Un film de science-fiction réalisé par Christopher Nolan."
 *               duree:
 *                 type: integer
 *                 example: 148
 *     responses:
 *       201:
 *         description: Film créé avec succès
 */
router.post("/films", createFilm);

/**
 * @swagger
 * /employee/films/{id}:
 *   get:
 *     summary: Récupère un film par son ID
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du film
 *     responses:
 *       200:
 *         description: Film trouvé
 */
router.get("/films/:id", getFilmById);

/**
 * @swagger
 * /employee/films/{id}:
 *   put:
 *     summary: Met à jour un film
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Film mis à jour
 */
router.put("/films/:id", updateFilm);

/**
 * @swagger
 * /employee/films/{id}:
 *   delete:
 *     summary: Supprime un film
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Film supprimé
 */
router.delete("/films/:id", deleteFilm);

/* ============================= SALLES ============================= */

/**
 * @swagger
 * /employee/salles:
 *   get:
 *     summary: Récupère toutes les salles
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des salles
 */
router.get("/salles", getAllSalles);

/**
 * @swagger
 * /employee/salles:
 *   post:
 *     summary: Crée une nouvelle salle
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Salle créée
 */
router.post("/salles", createSalle);

/**
 * @swagger
 * /employee/salles/{id}:
 *   get:
 *     summary: Récupère une salle par son ID
 *     tags: [Employés]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salle trouvée
 */
router.get("/salles/:id", getSalleById);

/**
 * @swagger
 * /employee/salles/{id}:
 *   put:
 *     summary: Met à jour une salle
 *     tags: [Employés]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salle mise à jour
 */
router.put("/salles/:id", updateSalle);

/**
 * @swagger
 * /employee/salles/{id}:
 *   delete:
 *     summary: Supprime une salle
 *     tags: [Employés]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salle supprimée
 */
router.delete("/salles/:id", deleteSalle);

/* ============================= SÉANCES ============================= */

/**
 * @swagger
 * /employee/seances:
 *   get:
 *     summary: Récupère toutes les séances
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des séances
 */
router.get("/seances", getAllSeances);

/**
 * @swagger
 * /employee/seances:
 *   post:
 *     summary: Crée une nouvelle séance
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Séance créée
 */
router.post("/seances", createSeance);

/**
 * @swagger
 * /employee/seances/{id}:
 *   get:
 *     summary: Récupère une séance par son ID
 *     tags: [Employés]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Séance trouvée
 */
router.get("/seances/:id", getSeanceById);

/**
 * @swagger
 * /employee/seances/{id}:
 *   put:
 *     summary: Met à jour une séance
 *     tags: [Employés]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Séance mise à jour
 */
router.put("/seances/:id", updateSeance);

/**
 * @swagger
 * /employee/seances/{id}:
 *   delete:
 *     summary: Supprime une séance
 *     tags: [Employés]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Séance supprimée
 */
router.delete("/seances/:id", deleteSeance);

/* ============================= AVIS ============================= */

/**
 * @swagger
 * /employee/avis:
 *   get:
 *     summary: Récupère tous les avis
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de tous les avis
 */
router.get("/avis", getAllAvis);

/**
 * @swagger
 * /employee/avis/en-attente:
 *   get:
 *     summary: Récupère les avis en attente de validation
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des avis en attente
 */
router.get("/avis/en-attente", getAvisEnAttente);

/**
 * @swagger
 * /employee/avis/{id}/valider:
 *   patch:
 *     summary: Valide un avis
 *     tags: [Employés]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Avis validé
 */
router.patch("/avis/:id/valider", validerAvis);

/**
 * @swagger
 * /employee/avis/{id}:
 *   delete:
 *     summary: Supprime un avis
 *     tags: [Employés]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Avis supprimé
 */
router.delete("/avis/:id", deleteAvis);

/* ============================= DASHBOARD ============================= */

/**
 * @swagger
 * /employee/dashboard:
 *   get:
 *     summary: Récupère les statistiques du tableau de bord employé
 *     tags: [Employés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques du tableau de bord renvoyées
 */
router.get("/dashboard", getDashboard);


export default router;