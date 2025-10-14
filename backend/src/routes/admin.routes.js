// src/routes/admin.routes.js
import express from "express";
import { verifyToken, authorizeRoles, checkMustChangePassword } from '../middleware/auth.middleware.js';
import { isAdmin } from "../middleware/admin.middleware.js";
import { createEmployee, resetPassword } from "../controllers/admin/employees.controller.js";
import { dashboardReservations } from "../controllers/mongo/mongo.admin.controller.js";

const router = express.Router();

// -----------------------------
// Dashboard
// -----------------------------
router.get("/dashboard", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Bienvenue sur le tableau de bord admin, ${req.user.email}` });
});

// Dashboard MongoDB : réservations sur 7 jours
router.get("/dashboard/reservations", verifyToken, authorizeRoles('admin'), dashboardReservations);

// -----------------------------
// Gestion des employés
// -----------------------------
router.post("/employees", verifyToken, authorizeRoles('admin'), createEmployee);          
router.patch("/employees/:id/reset-password", verifyToken, authorizeRoles('admin'), resetPassword);

// -----------------------------
// Gestion des films
// -----------------------------
router.post("/films", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Film ajouté avec succès" });
});

router.patch("/films/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Film ${req.params.id} mis à jour` });
});

router.delete("/films/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Film ${req.params.id} supprimé` });
});

// -----------------------------
// Gestion des séances
// -----------------------------
router.post("/seances", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Séance ajoutée" });
});

router.patch("/seances/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Séance ${req.params.id} mise à jour` });
});

router.delete("/seances/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Séance ${req.params.id} supprimée` });
});

// -----------------------------
// Gestion des salles
// -----------------------------
router.post("/salles", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Salle ajoutée" });
});

router.patch("/salles/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Salle ${req.params.id} mise à jour` });
});

router.delete("/salles/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Salle ${req.params.id} supprimée` });
});

// -----------------------------
// Gestion des cinémas
// -----------------------------
router.post("/cinemas", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Cinéma ajouté" });
});

router.patch("/cinemas/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Cinéma ${req.params.id} mis à jour` });
});

router.delete("/cinemas/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Cinéma ${req.params.id} supprimé` });
});

// -----------------------------
// Gestion des utilisateurs
// -----------------------------
router.get("/users", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Liste des utilisateurs renvoyée" });
});

router.patch("/users/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Utilisateur ${req.params.id} mis à jour` });
});

router.delete("/users/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Utilisateur ${req.params.id} supprimé` });
});



/**
 * @swagger
 * tags:
 *   - name: Administration
 *     description: Gestion du tableau de bord et des opérations administratives (employés, films, séances, salles, cinémas, utilisateurs)
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Accède au tableau de bord de l’administrateur
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bienvenue sur le tableau de bord
 *       401:
 *         description: Accès non autorisé
 */
router.get("/dashboard", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Bienvenue sur le tableau de bord admin, ${req.user.email}` });
});

/**
 * @swagger
 * /admin/dashboard/reservations:
 *   get:
 *     summary: Statistiques des réservations (MongoDB)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données de réservations sur 7 jours
 */
router.get("/dashboard/reservations", verifyToken, authorizeRoles('admin'), dashboardReservations);

/**
 * @swagger
 * /admin/employees:
 *   post:
 *     summary: Crée un nouvel employé
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: employe@test.com
 *               role:
 *                 type: string
 *                 example: employe
 *     responses:
 *       201:
 *         description: Employé créé
 *       400:
 *         description: Erreur de validation
 */
router.post("/employees", verifyToken, authorizeRoles('admin'), createEmployee);

/**
 * @swagger
 * /admin/employees/{id}/reset-password:
 *   patch:
 *     summary: Réinitialise le mot de passe d’un employé
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l’employé
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 */
router.patch("/employees/:id/reset-password", verifyToken, authorizeRoles('admin'), resetPassword);

/**
 * @swagger
 * /admin/films:
 *   post:
 *     summary: Ajoute un film
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Film ajouté
 */
router.post("/films", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Film ajouté avec succès" });
});

/**
 * @swagger
 * /admin/films/{id}:
 *   patch:
 *     summary: Met à jour un film
 *     tags: [Administration]
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
router.patch("/films/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Film ${req.params.id} mis à jour` });
});

/**
 * @swagger
 * /admin/films/{id}:
 *   delete:
 *     summary: Supprime un film
 *     tags: [Administration]
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
router.delete("/films/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Film ${req.params.id} supprimé` });
});

/**
 * @swagger
 * /admin/seances:
 *   post:
 *     summary: Ajoute une séance
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Séance ajoutée
 */
router.post("/seances", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Séance ajoutée" });
});

/**
 * @swagger
 * /admin/seances/{id}:
 *   patch:
 *     summary: Met à jour une séance
 *     tags: [Administration]
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
 *         description: Séance mise à jour
 */
router.patch("/seances/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Séance ${req.params.id} mise à jour` });
});

/**
 * @swagger
 * /admin/seances/{id}:
 *   delete:
 *     summary: Supprime une séance
 *     tags: [Administration]
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
 *         description: Séance supprimée
 */
router.delete("/seances/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Séance ${req.params.id} supprimée` });
});

/**
 * @swagger
 * /admin/salles:
 *   post:
 *     summary: Ajoute une salle
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Salle ajoutée
 */
router.post("/salles", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Salle ajoutée" });
});

/**
 * @swagger
 * /admin/salles/{id}:
 *   patch:
 *     summary: Met à jour une salle
 *     tags: [Administration]
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
router.patch("/salles/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Salle ${req.params.id} mise à jour` });
});

/**
 * @swagger
 * /admin/salles/{id}:
 *   delete:
 *     summary: Supprime une salle
 *     tags: [Administration]
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
router.delete("/salles/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Salle ${req.params.id} supprimée` });
});

/**
 * @swagger
 * /admin/cinemas:
 *   post:
 *     summary: Ajoute un cinéma
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Cinéma ajouté
 */
router.post("/cinemas", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Cinéma ajouté" });
});

/**
 * @swagger
 * /admin/cinemas/{id}:
 *   patch:
 *     summary: Met à jour un cinéma
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Cinéma mis à jour
 */
router.patch("/cinemas/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Cinéma ${req.params.id} mis à jour` });
});

/**
 * @swagger
 * /admin/cinemas/{id}:
 *   delete:
 *     summary: Supprime un cinéma
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cinéma supprimé
 */
router.delete("/cinemas/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Cinéma ${req.params.id} supprimé` });
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Liste tous les utilisateurs
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste renvoyée
 */
router.get("/users", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: "Liste des utilisateurs renvoyée" });
});

/**
 * @swagger
 * /admin/users/{id}:
 *   patch:
 *     summary: Met à jour un utilisateur
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 */
router.patch("/users/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Utilisateur ${req.params.id} mis à jour` });
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Supprime un utilisateur
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 */
router.delete("/users/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: `Utilisateur ${req.params.id} supprimé` });
});





























export default router;


