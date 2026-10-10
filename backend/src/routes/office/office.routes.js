import express from 'express';
import incidentsController from '../../controllers/office/incidents.controller.js';
import roomsController from '../../controllers/office/rooms.controller.js';

const router = express.Router();

router.get('/incidents', incidentsController.getAllIncidents);
router.post('/incidents', incidentsController.createIncident);
router.get('/incidents/stats', incidentsController.getStats);
router.get('/rooms', roomsController.getAllRooms);

export default router;
