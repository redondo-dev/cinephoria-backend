// src/routes/reservation.routes.js
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
  sendTicketByEmail
} from "../controllers/reservation.controller.js";

const router = express.Router();

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
 *               - seance_id
 *               - nb_places
 *               - prix_unitaire
 *             properties:
 *               seance_id:
 *                 type: integer
 *                 example: 15
 *               nb_places:
 *                 type: integer
 *                 example: 2
 *               prix_unitaire:
 *                 type: number
 *                 example: 9.90
 *               sieges:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [724, 725]
 *               statut_reservation:
 *                 type: string
 *                 enum: [en_attente, confirmee, annulee, valide]
 *                 example: en_attente
 *     responses:
 *       201:
 *         description: Réservation créée avec succès
 *       400:
 *         description: Champs obligatoires manquants
 *       401:
 *         description: Token manquant ou invalide
 */
router.post("/", authenticate, createReservation);

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
 *       401:
 *         description: Non autorisé
 */
router.get("/", authenticate, getAllReservations);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Récupère une réservation par ID avec jointures
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Réservation trouvée avec film, salle, cinéma et sièges
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Réservation non trouvée
 */
router.get("/:id", authenticate, getReservationById);

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Met à jour une réservation
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statut_reservation:
 *                 type: string
 *                 enum: [en_attente, confirmee, annulee, valide]
 *                 example: confirmee
 *     responses:
 *       200:
 *         description: Réservation mise à jour
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Réservation non trouvée
 */
router.put("/:id", authenticate, updateReservation);

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
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Réservation supprimée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Réservation non trouvée
 */
router.delete("/:id", authenticate, deleteReservation);

/**
 * @swagger
 * /reservations/{id}/send-email:
 *   post:
 *     summary: Envoie le billet par email
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Email envoyé avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Réservation non trouvée
 */
router.post("/:id/send-email", authenticate, sendTicketByEmail);

export default router;


