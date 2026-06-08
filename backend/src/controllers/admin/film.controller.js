import { Film, Seance, Genre } from '../../models/index.js';

// Créer un film
export const createFilm = async (req, res) => {
  try {
    const { titre, description, affiche, age_min, duree, date_ajout, coup_coeur, note_moyenne, nb_avis, genre_id } = req.body;

    if (!titre || !duree || !date_ajout) {
      return res.status(400).json({ 
        message: "Titre, durée et date d'ajout sont obligatoires" 
      });
    }

    const film = await Film.create({  // ← "film" au lieu de "filmId"
      titre,
      description,
      affiche,
      age_min,
      duree,
      date_ajout,
      coup_coeur,
      note_moyenne,
      nb_avis,
    });

    if (genre_id) {
      const genres = Array.isArray(genre_id) ? genre_id : [genre_id];
      await film.setGenres(genres);
    }

    res.status(201).json({ 
      message: "Film créé avec succès",
      film
    });
  } catch (error) {
    console.error("Erreur création film:", error);
    res.status(500).json({ message: "Erreur lors de la création du film" });
  }
};

export const getAllFilms = async (req, res) => {
  try {
    const films = await Film.findAll({
      order: [['date_ajout', 'DESC']],
      include: [{
        model: Genre,
        as: 'genres',
        attributes: ['id', 'nom'],
        through: { attributes: [] },
      }]
    });
    res.status(200).json(films);
  } catch (error) {
    console.error('Erreur lors de la récupération des films:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des films",
      error: error.message 
    });
  }
};

export const getFilmById = async (req, res) => {
  try {
    const film = await Film.findByPk(req.params.id, {  // ← include dans findByPk
      include: [{
        model: Genre,
        as: 'genres',
        attributes: ['id', 'nom'],
        through: { attributes: [] },
      }]
    });

    if (!film) {
      return res.status(404).json({ 
        message: `Film avec l'ID ${req.params.id} non trouvé` 
      });
    }

    res.status(200).json(film);
  } catch (error) {
    console.error('Erreur lors de la récupération du film:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération du film",
      error: error.message 
    });
  }
};

// Mettre à jour un film
export const updateFilm = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const film = await Film.findByPk(id);
    if (!film) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    await film.update(updates);

    if (updates.genre_id) {
      const genres = Array.isArray(updates.genre_id) ? updates.genre_id : [updates.genre_id];
      await film.setGenres(genres);
    }

    const updatedFilm = await Film.findByPk(id, {
      include: [{
        model: Genre,
        as: 'genres',
        attributes: ['id', 'nom'],
        through: { attributes: [] },
      }]
    });

    res.status(200).json({
      message: 'Film mis à jour avec succès',
      film: updatedFilm,
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

    const film = await Film.findByPk(id);
    if (!film) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    const seances = await Seance.findAll({ where: { film_id: id } });
    if (seances.length > 0) {
      return res.status(400).json({ 
        message: "Impossible de supprimer un film avec des séances programmées" 
      });
    }

    await film.destroy();

    res.json({ message: "Film supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression film:", error);
    res.status(500).json({ message: "Erreur serveur. Veuillez réessayer" });
  }
};