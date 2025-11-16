// controllers/employee/tarif.controller.js
import Tarif from '../../models/tarif.model.js';

export const getAllTarifs = async (req, res) => {
  try {
    const tarifs = await Tarif.findAll({
      order: [['type_tarif', 'ASC'], ['prix_unitaire', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: tarifs
    });
  } catch (error) {
    console.error('Erreur récupération tarifs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tarifs'
    });
  }
};

export const getTarifById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tarif = await Tarif.findByPk(id);

    if (!tarif) {
      return res.status(404).json({
        success: false,
        message: 'Tarif non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: tarif
    });
  } catch (error) {
    console.error('Erreur récupération tarif:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du tarif'
    });
  }
};

export const createTarif = async (req, res) => {
  try {
    const { nom_tarif, type_tarif, prix_unitaire, description } = req.body;

    const tarif = await Tarif.create({
      nom_tarif,
      type_tarif,
      prix_unitaire,
      description
    });

    res.status(201).json({
      success: true,
      data: tarif
    });
  } catch (error) {
    console.error('Erreur création tarif:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du tarif'
    });
  }
};

export const updateTarif = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_tarif, type_tarif, prix_unitaire, description } = req.body;

    const [updated] = await Tarif.update(
      { nom_tarif, type_tarif, prix_unitaire, description, updated_at: new Date() },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Tarif non trouvé'
      });
    }

    const tarif = await Tarif.findByPk(id);

    res.status(200).json({
      success: true,
      data: tarif
    });
  } catch (error) {
    console.error('Erreur mise à jour tarif:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du tarif'
    });
  }
};

export const deleteTarif = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Tarif.destroy({
      where: { id }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Tarif non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tarif supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression tarif:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du tarif'
    });
  }
};