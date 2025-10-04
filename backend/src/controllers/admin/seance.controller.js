const Seance = require('../models/Seance');

export const  SeanceController ={
  // Créer une nouvelle séance
  async create(req, res) {
    try {
      const seance = await Seance.create(req.body);
      res.status(201).json({
        success: true,
        data: seance
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },



  // Mettre à jour une séance
  async update(req, res) {
    try {
      const seance = await Seance.findByPk(req.params.id);
      if (!seance) {
        return res.status(404).json({
          success: false,
          message: 'Séance non trouvée'
        });
      }
      await seance.update(req.body);
      res.status(200).json({
        success: true,
        data: seance
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Supprimer une séance
  async delete(req, res) {
    try {
      const seance = await Seance.findByPk(req.params.id);
      if (!seance) {
        return res.status(404).json({
          success: false,
          message: 'Séance non trouvée'
        });
      }
      await seance.destroy();
      res.status(200).json({
        success: true,
        message: 'Séance supprimée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Vérifier les places disponibles
  async checkAvailability(req, res) {
    try {
      const seance = await Seance.findByPk(req.params.id, {
        include: ['salle', 'reservations']
      });
      if (!seance) {
        return res.status(404).json({
          success: false,
          message: 'Séance non trouvée'
        });
      }
      const placesOccupees = seance.reservations.reduce((total, r) => total + r.nombrePlaces, 0);
      const placesDisponibles = seance.salle.capacite - placesOccupees;
      
      res.status(200).json({
        success: true,
        data: {
          capaciteTotal: seance.salle.capacite,
          placesOccupees,
          placesDisponibles
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new SeanceController();