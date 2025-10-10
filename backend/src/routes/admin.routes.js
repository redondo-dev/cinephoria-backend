// src/routes/admin.routes.js
import express from "express";
import authMiddleware  from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import {createEmployee, resetPassword } from "../controllers/admin/employees.controller.js";
import  {dashboardReservations} from "../controllers/mongo/mongo.admin.controller.js";



const router = express.Router();

// -----------------------------
// Dashboard
// -----------------------------
router.get("/dashboard", authMiddleware, isAdmin, (req, res) => {

  res.json({ message: `Bienvenue sur le tableau de bord admin, ${req.user.email}` });
});

// Dashboard MongoDB : réservations sur 7 jours
router.get("/dashboard/reservations", authMiddleware, isAdmin, dashboardReservations);



// -----------------------------
// Gestion des employés
// -----------------------------
router.post("/employees", authMiddleware, isAdmin, createEmployee);          
router.patch("/employees/:id/reset-password", authMiddleware, isAdmin, resetPassword);

// -----------------------------
// Gestion des films
// -----------------------------
router.post("/films", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: "Film ajouté avec succès" });
});

router.patch("/films/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Film ${req.params.id} mis à jour` });
});

router.delete("/films/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Film ${req.params.id} supprimé` });
});

// -----------------------------
// Gestion des séances
// -----------------------------
router.post("/seances", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: "Séance ajoutée" });
});

router.patch("/seances/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Séance ${req.params.id} mise à jour` });
});

router.delete("/seances/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Séance ${req.params.id} supprimée` });
});

// -----------------------------
// Gestion des salles
// -----------------------------
router.post("/salles", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: "Salle ajoutée" });
});

router.patch("/salles/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Salle ${req.params.id} mise à jour` });
});

router.delete("/salles/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Salle ${req.params.id} supprimée` });
});

// -----------------------------
// Gestion des cinémas
// -----------------------------
router.post("/cinemas", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: "Cinéma ajouté" });
});

router.patch("/cinemas/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Cinéma ${req.params.id} mis à jour` });
});

router.delete("/cinemas/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Cinéma ${req.params.id} supprimé` });
});

// -----------------------------
// Gestion des utilisateurs
// -----------------------------
router.get("/users", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: "Liste des utilisateurs renvoyée" });
});

router.patch("/users/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Utilisateur ${req.params.id} mis à jour` });
});

router.delete("/users/:id", authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Utilisateur ${req.params.id} supprimé` });
});

export default router;
