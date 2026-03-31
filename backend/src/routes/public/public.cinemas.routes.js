// src/routes/public/cinema.routes.js
import express from 'express';
import { getCinemas } from '../../controllers/public/cinema/cinema.controller.js';

const router = express.Router();

// GET /api/cinemas
router.get('/', getCinemas);

export default router;
