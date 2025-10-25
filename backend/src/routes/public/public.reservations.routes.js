// src/routes/public/public.reservations.routes.js
import express from "express";

import {
  getCinemas,
  getFilmsByCinema,
  getSeancesByFilm,
 
 
} from "../../controllers/public/cinema/cinema.controller.js";

const router = express.Router();



router.get("/cinemas", getCinemas);
router.get("/cinemas/:id/films", getFilmsByCinema);
router.get("/cinemas/:cinemaId/films/:filmId/seances", getSeancesByFilm);
// router.get("/seances/:id/sieges", getSiegesDisponibles);



export default router;