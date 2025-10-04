// routes/employee.js
import { Router } from 'express';
const router = Router();
import { authMiddleware, isEmployee } from '../middleware/auth';

import { getAllFilms, createFilm, getFilmById, updateFilm, deleteFilm } from '../controllers/employee/film.controller';
import { getAllSalles, createSalle, getSalleById, updateSalle, deleteSalle } from '../controllers/employee/salle.controlle';
import { getAllSeances, createSeance, getSeanceById, updateSeance, deleteSeance } from '../controllers/employee/seance.controller';
import { getAllAvis, getAvisEnAttente, validerAvis, deleteAvis } from '../controllers/employee/avis.controller';
import { getDashboard } from '../controllers/employee/intranet.controller';

// Appliquer les middlewares d'authentification
router.use(authMiddleware, isEmployee);

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

export default router;