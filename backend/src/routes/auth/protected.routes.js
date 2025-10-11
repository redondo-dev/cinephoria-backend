/// src/routes/protected.routes.js

import express from 'express';
import { verifyToken, authorizeRoles, checkMustChangePassword } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Route accessible à tout utilisateur connecté
 */
router.get(
  '/protected',
  verifyToken, // Vérifie le token JWT
  checkMustChangePassword, // Vérifie si l'utilisateur doit changer son mot de passe
  (req, res) => {
    res.json({ message: `Bonjour ${req.user.email}, vous êtes connecté !` });
  }
);



export default router;

