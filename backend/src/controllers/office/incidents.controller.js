
import { Incident, Salle, User } from '../../models/index.js';

const incidentsController = {
  // GET /api/office/incidents
  getAllIncidents: async (req, res) => {
    try {
      const incidents = await Incident.findAll({
        include: [
          { model: Salle, as: 'salle' },
          { model: User, as: 'utilisateur' }
        ],
        order: [['date_incident', 'DESC']]
      });
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/office/incidents
  createIncident: async (req, res) => {
    try {
      const { titre, description, priorite, salle_id, utilisateur_id } = req.body;
      
      const incident = await Incident.create({
        titre,
        description,
        priorite: priorite || 'moyenne',
        statut: 'ouvert',
        salle_id,
        utilisateur_id,
        date_incident: new Date()
      });
      
      res.status(201).json(incident);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/office/incidents/stats
  getStats: async (req, res) => {
    try {
      const total = await Incident.count();
      const open = await Incident.count({ where: { statut: 'ouvert' } });
      const critical = await Incident.count({ where: { priorite: 'critique' } });
      
      res.json({ total, open, critical });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default incidentsController;