import { Salle } from '../../models/index.js';

const roomsController = {
  // GET /api/office/rooms
  getAllRooms: async (req, res) => {
    try {
      const salles = await Salle.findAll({
        attributes: [
          'id',
          'cinema_id',
          ['nom_salle', 'nom'],
          ['capacite', 'capacite'],
          ['qualite_projection', 'qualite_projection'],
        ],
        order: [['id', 'ASC']],
      });
      res.json(salles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default roomsController;
