import express from 'express';
import incidentsController from '../../controllers/office/incidents.controller.js';

const router = express.Router();


router.get('/incidents', incidentsController.getAllIncidents);
router.post('/incidents', incidentsController.createIncident);
router.get('/incidents/stats', incidentsController.getStats);

export default router;