import { Cinema } from "../../models/index.js";

export const CinemaController = {
  // Créer un cinéma
  async create(req, res) {
    try {
      const cinema = await Cinema.create(req.body);
      res.status(201).json({
        success: true,
        data: cinema
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Récupérer tous les cinémas
  async getAll(req, res) {
    try {
      const cinemas = await Cinema.findAll({
        include: ['salles']
      });
      res.status(200).json({
        success: true,
        data: cinemas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Récupérer un cinéma par ID
  async getById(req, res) {
    try {
      const cinema = await Cinema.findByPk(req.params.id, {
        include: ['salles', 'seances']
      });
      if (!cinema) {
        return res.status(404).json({
          success: false,
          message: 'Cinéma non trouvé'
        });
      }
      res.status(200).json({
        success: true,
        data: cinema
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },


  // Mettre à jour un cinéma
  async update(req, res) {
    try {
      const cinema = await Cinema.findByPk(req.params.id);
      if (!cinema) {
        return res.status(404).json({
          success: false,
          message: 'Cinéma non trouvé'
        });
      }
      await cinema.update(req.body);
      res.status(200).json({
        success: true,
        data: cinema
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Supprimer un cinéma
  async delete(req, res) {
    try {
      const cinema = await Cinema.findByPk(req.params.id);
      if (!cinema) {
        return res.status(404).json({
          success: false,
          message: 'Cinéma non trouvé'
        });
      }
      await cinema.destroy();
      res.status(200).json({
        success: true,
        message: 'Cinéma supprimé avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};