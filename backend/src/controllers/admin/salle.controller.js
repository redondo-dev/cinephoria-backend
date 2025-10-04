// controllers/salle.controller.js
import Salle from "../models/Salle.js";



export const SalleController = {
  // Créer une nouvelle salle
 async create(req, res) {
  try {
    const { nom_salle, capacite, cinema_id, qualite_projection } = req.body;

    // Vérifications nom de salle et cinema _id
    if (!nom_salle || nom_salle.trim() === "") {
      return res.status(400).json({ success: false, message: "Le nom de la salle est obligatoire" });
    }
    if (!cinema_id) {
      return res.status(400).json({ success: false, message: "L'identifiant du cinéma est obligatoire" });
    }

    // Vérification manuelle cohérente avec le modèle
    const qualitesValides = ["Standard", "2D", "3D", "IMAX", "4DX", "Dolby Atmos", "ScreenX"];
    if (qualite_projection && !qualitesValides.includes(qualite_projection)) {
      return res.status(400).json({ success: false, message: "Qualité de projection invalide" });
    }

    // validations sequielize (capacite min/max, etc.)
    const salle = await Salle.create({
      nom_salle: nom_salle.trim(),
      capacite:Number(capacite),
      cinema_id:Number(cinema_id),
      qualite_projection,
    },{ validate: true });

    return res.status(201).json({ success: true, data: salle });

  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(", "),
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}
  ,


  // Mettre à jour une salle
  async update(req, res) {
    try {
      const salle = await Salle.findByPk(req.params.id);
      if (!salle) {
        return res.status(404).json({
          success: false,
          message: "Salle non trouvée",
        });
      }

      await salle.update(req.body);

      res.status(200).json({
        success: true,
        data: salle,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Supprimer une salle
  async delete(req, res) {
    try {
      const salle = await Salle.findByPk(req.params.id);
      if (!salle) {
        return res.status(404).json({
          success: false,
          message: "Salle non trouvée",
        });
      }
      await salle.destroy();
      res.status(200).json({
        success: true,
        message: "Salle supprimée avec succès",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

 
};

