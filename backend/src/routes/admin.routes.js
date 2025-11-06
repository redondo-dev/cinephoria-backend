// src/routes/admin.routes.js
import express from "express";
import { verifyToken, authorizeRoles, checkMustChangePassword } from '../middleware/auth.middleware.js';
import { createFilm,getAllFilms,getFilmById,deleteFilm,updateFilm} from '../controllers/admin/film.controller.js';
import { createEmployee,getEmployes, getEmployeById,deleteEmployee,updateEmployee, resetPassword} from "../controllers/admin/employees.controller.js";
import { createSalle,updateSalle, deleteSalle,getAllSalles, getSalleById} from "../controllers/admin/salle.controller.js";
import {createSeance,updateSeance,deleteSeance,getAllSeances,getSeanceById,checkSeanceAvailability} from "../controllers/admin/seance.controller.js";
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
router.get("/employes/:id",getEmployeById);
router.get('/employes', getEmployes);
router.post("/employes", createEmployee);    
router.put("/employes/:id",updateEmployee );  
router.delete("/employes/:id", deleteEmployee); 
router.patch("/employes/:id/reset-password", resetPassword);

// -----------------------------
// Gestion des films
// -----------------------------
router.get('/films/:id', getFilmById);
router.get('/films', getAllFilms);
router.post('/films', createFilm);
router.put('/films/:id', updateFilm);
router.delete('/films/:id', deleteFilm);

// -----------------------------
// Gestion des séances
// -----------------------------
router.get("/seances", getAllSeances);            
router.get("/seances/:id", getSeanceById);        
router.post("/seances", createSeance);            
router.patch("/seances/:id", updateSeance);       
router.delete("/seances/:id", deleteSeance);     
router.get("/seances/:id/disponibilite", checkSeanceAvailability); // Vérifier disponibilité

// // -----------------------------
// // Gestion des salles
// // -----------------------------
router.get("/salles", getAllSalles);        
router.get("/salles/:id", getSalleById);     
router.post("/salles", createSalle);        
router.patch("/salles/:id", updateSalle);    
router.delete("/salles/:id", deleteSalle); 
// // -----------------------------
// // Gestion des cinémas
// // -----------------------------
// router.post('/', createCinema);
// router.patch('/:id', updateCinema);
// router.delete('/:id', deleteCinema);
// // -----------------------------
// // Gestion des utilisateurs
// // -----------------------------
// router.get("/users", verifyToken, authorizeRoles('admin'), (req, res) => {
//   res.json({ message: "Liste des utilisateurs renvoyée" });
// });

// router.patch("/users/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
//   res.json({ message: `Utilisateur ${req.params.id} mis à jour` });
// });

// router.delete("/users/:id", verifyToken, authorizeRoles('admin'), (req, res) => {
//   res.json({ message: `Utilisateur ${req.params.id} supprimé` });
// });



































export default router;


