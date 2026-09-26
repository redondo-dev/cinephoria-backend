// src/routes/genre.routes.js
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { isAdminOrEmploye } from "../middleware/auth.middleware.js"; 
import {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
} from "../controllers/genre.controller.js";

const router = express.Router();

// Routes publiques (lecture) — utile pour le filtre "Genre" de la page Films (US5)
// et pour peupler le sélecteur du formulaire de création/édition de film.
router.get("/", getAllGenres);
router.get("/:id", getGenreById);

// Routes protégées (écriture) — réservées admin/employé
router.post("/", authenticate, isAdminOrEmploye, createGenre);
router.put("/:id", authenticate, isAdminOrEmploye, updateGenre);
router.delete("/:id", authenticate, isAdminOrEmploye, deleteGenre);

export default router;