// src/routes/reservation.routes.js
import express from "express";

import {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
} from "../controllers/reservation.controller.js";

const router = express.Router();

router.post("/", createReservation);
router.get("/", getAllReservations);
router.get("/:id", getReservationById);
router.put("/:id", updateReservation);
router.delete("/:id", deleteReservation);


/**
 * @swagger
 * tags:
 *   name: Réservations
 *   description: Gestion des réservations de films
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Crée une nouvelle réservation
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - utilisateurId
 *               - seanceId
 *               - nbPlaces
 *             properties:
 *               utilisateurId:
 *                 type: integer
 *                 example: 12
 *               seanceId:
 *                 type: integer
 *                 example: 45
 *               nbPlaces:
 *                 type: integer
 *                 example: 2
 *               total:
 *                 type: number
 *                 example: 19.80
 *     responses:
 *       201:
 *         description: Réservation créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 87
 *                 statut:
 *                   type: string
 *                   example: "en_attente"
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post("/", createReservation);

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Récupère toutes les réservations
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de toutes les réservations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 5
 *                   utilisateur:
 *                     type: string
 *                     example: "jean.dupont@example.com"
 *                   film:
 *                     type: string
 *                     example: "Dune : Deuxième Partie"
 *                   dateSeance:
 *                     type: string
 *                     example: "2025-10-18T20:00:00"
 *                   nbPlaces:
 *                     type: integer
 *                     example: 2
 *                   total:
 *                     type: number
 *                     example: 19.80
 *                   statut:
 *                     type: string
 *                     example: "valide"
 *       401:
 *         description: Non autorisé
 */
router.get("/", getAllReservations);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Récupère une réservation spécifique
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la réservation
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Réservation trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 42
 *                 film:
 *                   type: string
 *                   example: "Inception"
 *                 nbPlaces:
 *                   type: integer
 *                   example: 3
 *                 total:
 *                   type: number
 *                   example: 27.00
 *                 statut:
 *                   type: string
 *                   example: "en_attente"
 *       404:
 *         description: Réservation non trouvée
 */
router.get("/:id", getReservationById);

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Met à jour une réservation existante
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la réservation à modifier
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nbPlaces:
 *                 type: integer
 *                 example: 4
 *               total:
 *                 type: number
 *                 example: 36.00
 *               statut:
 *                 type: string
 *                 enum: [en_attente, valide, annulée]
 *                 example: "valide"
 *     responses:
 *       200:
 *         description: Réservation mise à jour avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Réservation non trouvée
 */
router.put("/:id", updateReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Supprime une réservation
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la réservation à supprimer
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Réservation supprimée avec succès
 *       404:
 *         description: Réservation non trouvée
 */
router.delete("/:id", deleteReservation);

export default router;