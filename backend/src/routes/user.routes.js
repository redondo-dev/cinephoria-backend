// routes/user.js
import { Router } from 'express';
const router = Router();
import isClient from '../middleware/user.middleware.js';
import { getMesCommandes, getCommandeById } from '../controllers/user/commande.controller.js';
import { createAvis, getMesAvis, getFilmsANoter } from '../controllers/user/avis.controller.js';
import { getProfile } from '../controllers/user/profil.controller.js';

// Appliquer le middleware à toutes les routes
router.use(isClient);

router.get('/profile', getProfile);

// Routes Commandes
router.get('/commandes', getMesCommandes);
router.get('/commandes/:id', getCommandeById);

// Routes Avis
router.post('/avis', createAvis);
router.get('/avis', getMesAvis);
router.get('/films-a-noter', getFilmsANoter);

export default router;