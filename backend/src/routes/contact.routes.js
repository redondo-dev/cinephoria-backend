// backend/src/routes/contact.routes.js
import express from "express";
import { postContact } from "../controllers/contact/contact.controller.js";
import { validateContact } from "../middleware/contact.middleware.js";

const router = express.Router();


router.post('/send',validateContact, postContact);


/**
 * @swagger
 * /contact/send:
 *   post:
 *     summary: Envoie un message depuis le formulaire de contact
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - email
 *               - titre
 *               - description
 *             properties:
 *               nom:
 *                 type: string
 *                 example: "Jean Dupont"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jean.dupont@example.com"
 *               titre:
 *                 type: string
 *                 example: "Problème de réservation"
 *               description:
 *                 type: string
 *                 example: "Je n’ai pas reçu le mail de confirmation pour ma réservation."
 *     responses:
 *       200:
 *         description: Message envoyé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Votre message a bien été envoyé"
 *       400:
 *         description: Données invalides
 */

   
export default router;