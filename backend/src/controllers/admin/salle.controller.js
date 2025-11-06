import Salle from "../../models/salle.model.js";

// Création d'une salle
export const createSalle = async (req, res) => {
  try {
    const { nom_salle, capacite, cinema_id, qualite_projection } = req.body;

    if (!nom_salle || nom_salle.trim() === "") {
      return res.status(400).json({ message: "Le nom de la salle est obligatoire" });
    }
    if (!cinema_id) {
      return res.status(400).json({ message: "L'identifiant du cinéma est obligatoire" });
    }

    const qualitesValides = ["Standard", "2D", "3D", "IMAX", "4DX", "Dolby Atmos", "ScreenX"];
    if (qualite_projection && !qualitesValides.includes(qualite_projection)) {
      return res.status(400).json({ message: "Qualité de projection invalide" });
    }

    const salle = await Salle.create({
      nom_salle: nom_salle.trim(),
      capacite: Number(capacite),
      cinema_id: Number(cinema_id),
      qualite_projection
    }, { validate: true });

    res.status(201).json({ message: "Salle créée avec succès", data: salle });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: error.errors.map(e => e.message).join(", ")
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Mise à jour d'une salle
export const updateSalle = async (req, res) => {
  try {
    const { id } = req.params;
    const salle = await Salle.findByPk(id);

    if (!salle) {
      return res.status(404).json({ message: "Salle non trouvée" });
    }

    await salle.update(req.body);

    res.status(200).json({ message: "Salle mise à jour avec succès", data: salle });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Suppression d'une salle
export const deleteSalle = async (req, res) => {
  try {
    const { id } = req.params;
    const salle = await Salle.findByPk(id);

    if (!salle) {
      return res.status(404).json({ message: "Salle non trouvée" });
    }

    await salle.destroy();
    res.status(200).json({ message: "Salle supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer toutes les salles
export const getAllSalles = async (req, res) => {
  try {
    const salles = await Salle.findAll();
     console.log('Salles récupérées:', salles); 
    res.status(200).json({ data: salles });
  } catch (error) {
        console.error('Erreur getAllSalles:', error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer une salle par ID
export const getSalleById = async (req, res) => {
  try {
    const { id } = req.params;
    const salle = await Salle.findByPk(id);

    if (!salle) {
      return res.status(404).json({ message: "Salle non trouvée" });
    }

    res.status(200).json({ data: salle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

