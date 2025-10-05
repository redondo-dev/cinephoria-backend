/// src/routes/protected.routes.js

import express from 'express';
import authMiddleware  from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: `Bonjour ${req.user.email}, vous êtes connecté !` });
});

export default router;


