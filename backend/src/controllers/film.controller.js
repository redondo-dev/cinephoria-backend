// controllers/film.controller.js
// Contrôleur UNIQUE pour la gestion des films, partagé par les routes /api/admin et /api/employee.
// L'autorisation (isAdmin / isAdminOrEmploye) est déjà gérée au niveau des routes dans app.js.


import { Film, Seance, Genre } from '../models/index.js';

// ======================================================
// Récupérer tous les films
// ======================================================
export const getAllFilms = async (req, res) => {
  try {
    const films = await Film.findAll({
      order: [['date_ajout', 'DESC']],
      include: [{
        model: Genre,
        as: 'genres',
        attributes: ['id', 'nom'],
        through: { attributes: [] },
      }],
    });
    // Format aligné sur la convention du reste de l'API ({ success, data }) — utilisée par
    // getAllSalles, getAllSeances, getAllAvis, getAllTarifs, et déjà attendue par
    // AdminService.getSalles() et FilmsService.getAll() (employé). C'est AdminService.getFilms()
    // qui doit être corrigé pour déballer .data, pas le backend qui doit s'en écarter.
    res.status(200).json({ success: true, count: films.length, data: films });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des films',
      error: error.message
    });
  }
};

// ======================================================
// Récupérer un film par ID
// ======================================================
export const getFilmById = async (req, res) => {
  try {
    const film = await Film.findByPk(req.params.id, {
      include: [{
        model: Genre,
        as: 'genres',
        attributes: ['id', 'nom'],
        through: { attributes: [] },
      }],
    });

    if (!film) {
      return res.status(404).json({ success: false, message: 'Film non trouvé' });
    }

    res.status(200).json({ success: true, data: film });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du film',
      error: error.message
    });
  }
};

// ======================================================
// Créer un nouveau film
// ======================================================
export const createFilm = async (req, res) => {
  try {
    const {
      titre, description, affiche, age_min, duree,
      date_ajout, coup_coeur, note_moyenne, nb_avis, genre_id
    } = req.body;

    // Champs obligatoires : titre, durée et genre (cf. MCD : FILM (1,N) — GENRE, un film doit
    // avoir au moins un genre). date_ajout a une valeur par défaut (NOW) côté modèle, non bloquant.
    if (!titre || !duree || !genre_id) {
      return res.status(400).json({
        success: false,
        message: 'Titre, durée et au moins un genre sont obligatoires'
      });
    }

    const film = await Film.create({
      titre, description, affiche, age_min, duree,
      date_ajout, coup_coeur, note_moyenne, nb_avis,
    });

    // Association des genres via la table de jonction film_genre — jamais via une colonne
    // genre_id directe, qui n'existe pas sur Film.
    const genres = Array.isArray(genre_id) ? genre_id : [genre_id];
    if (genres.length === 0) {
      await film.destroy();
      return res.status(400).json({ success: false, message: 'Au moins un genre est obligatoire' });
    }
    await film.setGenres(genres);

    const filmComplet = await Film.findByPk(film.id, {
      include: [{ model: Genre, as: 'genres', attributes: ['id', 'nom'], through: { attributes: [] } }],
    });

    res.status(201).json({ success: true, message: 'Film créé avec succès', data: filmComplet });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du film',
      error: error.message
    });
  }
};

// ======================================================
// Mettre à jour un film
// ======================================================
export const updateFilm = async (req, res) => {
  try {
    const film = await Film.findByPk(req.params.id);
    if (!film) {
      return res.status(404).json({ success: false, message: 'Film non trouvé' });
    }

    const {
      titre, description, affiche, age_min, duree,
      date_ajout, coup_coeur, note_moyenne, nb_avis, genre_id
    } = req.body;

    // film.update(), pas findByPk(id, data, options) — cette dernière forme ne sauvegarde rien.
    await film.update({
      ...(titre !== undefined && { titre }),
      ...(description !== undefined && { description }),
      ...(affiche !== undefined && { affiche }),
      ...(age_min !== undefined && { age_min }),
      ...(duree !== undefined && { duree }),
      ...(date_ajout !== undefined && { date_ajout }),
      ...(coup_coeur !== undefined && { coup_coeur }),
      ...(note_moyenne !== undefined && { note_moyenne }),
      ...(nb_avis !== undefined && { nb_avis }),
      updatedBy: req.user?.id || null,
    });

    if (genre_id !== undefined) {
      const genres = Array.isArray(genre_id) ? genre_id : [genre_id];
      if (genres.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Un film doit conserver au moins un genre'
        });
      }
      await film.setGenres(genres);
    }

    const updatedFilm = await Film.findByPk(req.params.id, {
      include: [{ model: Genre, as: 'genres', attributes: ['id', 'nom'], through: { attributes: [] } }],
    });

    res.status(200).json({ success: true, message: 'Film mis à jour avec succès', data: updatedFilm });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du film',
      error: error.message
    });
  }
};

// ======================================================
// Supprimer un film
// ======================================================
export const deleteFilm = async (req, res) => {
  try {
    const film = await Film.findByPk(req.params.id);
    if (!film) {
      return res.status(404).json({ success: false, message: 'Film non trouvé' });
    }

    const seancesCount = await Seance.count({ where: { film_id: req.params.id } });
    if (seancesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce film : ${seancesCount} séance(s) y sont encore associées. `
          + `Supprimez-les d'abord depuis la page Séances (filtrez par ce film), puis réessayez.`,
        seancesCount,
        filmId: film.id,
      });
    }

    await film.destroy();
    res.status(200).json({ success: true, message: 'Film supprimé avec succès' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du film',
      error: error.message
    });
  }
};