// src/routes/auth.routes.js
import express from "express";
import { login, logout,forgotPassword,changeTempPassword,forgotPasswordVisitor} from "../../controllers/auth/auth.controller.js";
import { confirmEmail } from "../../controllers/auth/confirm.controller.js";
import { register,registerWithTempPassword } from "../../controllers/auth/register.controller.js";
import { resetPassword } from "../../controllers/auth/auth.controller.js";

const router = express.Router();


// Création compte standard (visiteur, utilisateur)
router.post("/register", register);

// Création compte avec mot de passe temporaire (admin, employé)
router.post("/register-temp", registerWithTempPassword);

// Confirmation compte par lien email
router.get ("/confirm/:token", confirmEmail);   

// Mot de passe oublié → envoi mot de passe temporaire
router.post("/forgot-password", forgotPassword);   

// Changer le mot de passe temporaire
router.post ("/change-temp-password",changeTempPassword);  

// Login, Logout
router.post("/login", login);
router.post("/logout", logout);
router.post('/forgot-password-visiteur', forgotPasswordVisitor);
router.post("/reset-password", resetPassword);



/**
 * @swagger
 * tags:
 *   name: Authentification
 *   description: Routes liées à la gestion des utilisateurs et à l'authentification
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d’un utilisateur standard (visiteur)
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: visiteur@test.com
 *               password:
 *                 type: string
 *                 example: MonMotDePasse2025!
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides ou utilisateur existant
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/register-temp:
 *   post:
 *     summary: Création d’un compte avec mot de passe temporaire (admin ou employé)
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: employe@test.com
 *               role:
 *                 type: string
 *                 enum: [admin, employe]
 *                 example: employe
 *     responses:
 *       201:
 *         description: Compte créé avec mot de passe temporaire envoyé par email
 */
router.post("/register-temp", registerWithTempPassword);

/**
 * @swagger
 * /auth/confirm/{token}:
 *   get:
 *     summary: Confirme un compte utilisateur via un lien email
 *     tags: [Authentification]
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         description: Jeton de confirmation reçu par email
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compte confirmé avec succès
 *       400:
 *         description: Token invalide ou expiré
 */
router.get("/confirm/:token", confirmEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Envoi d’un mot de passe temporaire à l’utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: utilisateur@test.com
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/change-temp-password:
 *   post:
 *     summary: Change le mot de passe temporaire par un mot de passe définitif
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - tempPassword
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: employe@test.com
 *               tempPassword:
 *                 type: string
 *                 example: 12345678
 *               newPassword:
 *                 type: string
 *                 example: MonNouveauMotDePasse2025!
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *       400:
 *         description: Token ou mot de passe temporaire invalide
 */
router.post("/change-temp-password", changeTempPassword);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authentifie un utilisateur et retourne un token JWT
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: visiteur@test.com
 *               password:
 *                 type: string
 *                 example: MonMotDePasse2025!
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *       401:
 *         description: Identifiants invalides
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion de l’utilisateur
 *     tags: [Authentification]
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/forgot-password-visiteur:
 *   post:
 *     summary: Envoi d’un mot de passe temporaire à un visiteur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: visiteur@test.com
 *     responses:
 *       200:
 *         description: Mot de passe temporaire envoyé au visiteur
 */
router.post("/forgot-password-visiteur", forgotPasswordVisitor);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Réinitialise le mot de passe d’un utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: visiteur3@test.com
 *               password:
 *                 type: string
 *                 example: edbcb5647d6f
 *               newPassword:
 *                 type: string
 *                 example: MonNouveauMotDePasse2025!
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Erreur dans les données envoyées
 */
router.post("/reset-password", resetPassword);

export default router;

