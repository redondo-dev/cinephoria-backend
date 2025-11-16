// routes/user.js
import { Router } from 'express';
const router = Router();
import { 
  authenticate, 
  isClient, 
  requireConfirmedAccount 
} from '../middleware/auth.middleware.js';

import { getMesCommandes, getCommandeById } from '../controllers/user/commande.controller.js';
import { createAvis, getMesAvis, getFilmsANoter } from '../controllers/user/avis.controller.js';
import { getProfile } from '../controllers/user/profil.controller.js';

// Appliquer authenticate + isClient + requireConfirmedAccount à TOUTES les routes
router.use(authenticate);
router.use(isClient);
router.use(requireConfirmedAccount);




/**
 * @swagger
 * tags:
 *   name: Utilisateur
 *   description: Opérations liées au compte utilisateur connecté
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Récupère le profil de l'utilisateur connecté
 *     tags: [Utilisateur]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 42
 *                 nom:
 *                   type: string
 *                   example: Jean Dupont
 *                 email:
 *                   type: string
 *                   example: jean.dupont@example.com
 *       401:
 *         description: Non autorisé - token manquant ou invalide
 */
router.get("/profile", getProfile);

/**
 * @swagger
 * /user/commandes:
 *   get:
 *     summary: Liste des commandes de l'utilisateur connecté
 *     tags: [Utilisateur]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des commandes renvoyée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 15
 *                   date:
 *                     type: string
 *                     example: "2025-10-12"
 *                   montant:
 *                     type: number
 *                     example: 24.5
 *       401:
 *         description: Non autorisé
 */
router.get("/commandes", getMesCommandes);

/**
 * @swagger
 * /user/commandes/{id}:
 *   get:
 *     summary: Récupère une commande spécifique par ID
 *     tags: [Utilisateur]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la commande
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Commande trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 15
 *                 montant:
 *                   type: number
 *                   example: 24.5
 *                 date:
 *                   type: string
 *                   example: "2025-10-12"
 *       404:
 *         description: Commande non trouvée
 */
router.get("/commandes/:id", getCommandeById);

/**
 * @swagger
 * /user/avis:
 *   post:
 *     summary: Crée un nouvel avis sur un film
 *     tags: [Utilisateur]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filmId:
 *                 type: integer
 *                 example: 3
 *               note:
 *                 type: integer
 *                 example: 5
 *               commentaire:
 *                 type: string
 *                 example: "Super film, effets visuels incroyables !"
 *     responses:
 *       201:
 *         description: Avis créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post("/avis", createAvis);

/**
 * @swagger
 * /user/avis:
 *   get:
 *     summary: Liste des avis rédigés par l'utilisateur
 *     tags: [Utilisateur]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des avis de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 12
 *                   film:
 *                     type: string
 *                     example: "Inception"
 *                   note:
 *                     type: integer
 *                     example: 4
 *                   commentaire:
 *                     type: string
 *                     example: "Très bon scénario, un peu complexe."
 *       401:
 *         description: Non autorisé
 */
router.get("/avis", getMesAvis);

/**
 * @swagger
 * /user/films-a-noter:
 *   get:
 *     summary: Liste les films que l'utilisateur peut encore noter
 *     tags: [Utilisateur]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des films disponibles à la notation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   filmId:
 *                     type: integer
 *                     example: 7
 *                   titre:
 *                     type: string
 *                     example: "Dune : Deuxième partie"
 *       401:
 *         description: Non autorisé
 */
router.get("/films-a-noter", getFilmsANoter);

export default router;