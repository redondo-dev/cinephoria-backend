import Film from '../models/Film.js';

// Créer un film
export const createFilm = async (req, res) => {
  try {
    const { titre, description, affiche, age_min,duree, date_ajout, coup_coeur ,note_moyenne,nb_avis, genre_id } = req.body;

    // Validation
    if (!titre || !duree || !date_ajout) {
      return res.status(400).json({ 
        message: "Titre, durée et date d'jout sont obligatoires" 
      });
    }

    const filmId = await Film.create({
      titre,
      description,
      affiche, 
      age_min,
      duree,
      date_ajout,
      coup_coeur,
      note_moyenne,
      nb_avis,
      genre_id,
        
    });

    res.status(201).json({ 
      message: "Film créé avec succès",
      filmId 
    });
  } catch (error) {
    console.error("Erreur création film:", error);
    res.status(500).json({ message: "Erreur lors de la création du film" });
  }
};

// Mettre à jour un film
export const updateFilm = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const film = await Film.findById(id);
    if (!film) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    await Film.update(id, updates);

    res.json({ 
      message: "Film mis à jour avec succès",
      filmId: id 
    });
  } catch (error) {
    console.error("Erreur mise à jour film:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

// Supprimer un film
export const deleteFilm = async (req, res) => {
  try {
    const { id } = req.params;

    const film = await Film.findById(id);
    if (!film) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    // Vérifier s'il y a des séances associées
    const seances = await Film.getSeances(id);
    if (seances.length > 0) {
      return res.status(400).json({ 
        message: "Impossible de supprimer un film avec des séances programmées" 
      });
    }

    await Film.delete(id);

    res.json({ message: "Film supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression film:", error);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};