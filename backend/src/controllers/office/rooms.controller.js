import { Salle } from '../../models/index.js';

const roomsController = {
  // GET /api/office/rooms
  getAllRooms: async (req, res) => {
    try {
      const salles = await Salle.findAll({ order: [['id', 'ASC']] });
      res.json(salles.map((s) => ({ ...s.toJSON(), nom: s.nom_salle })));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default roomsController;
