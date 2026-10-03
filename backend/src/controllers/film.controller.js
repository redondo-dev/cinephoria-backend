// controllers/film.controller.js
// Contrôleur UNIQUE pour la gestion des films, partagé par les routes /api/admin et /api/employee.
// L'autorisation (isAdmin / isAdminOrEmploye) est déjà gérée au niveau des routes dans app.js.


import { sequelize, Film, Seance, Genre } from '../models/index.js';

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
      date_ajout, coup_coeur, genre_id
    } = req.body;

    // Validation AVANT toute ecriture : titre, duree et au moins un genre valide
    // (cf. MCD : FILM (1,N) — GENRE). note_moyenne et nombre_avis sont des champs
    // calcules a partir des avis : ils ne sont pas saisis ici (valeur par defaut 0).
    const genres = Array.isArray(genre_id) ? genre_id : [genre_id];
    if (!titre || !duree || genres.length === 0 || genres.some((g) => !g)) {
      return res.status(400).json({
        success: false,
        message: 'Titre, durée et au moins un genre sont obligatoires'
      });
    }

    // Film + liaisons film_genre dans une seule transaction : tout est enregistre, ou rien.
    const filmComplet = await sequelize.transaction(async (t) => {
      const film = await Film.create(
        { titre, description, affiche, age_min, duree, date_ajout, coup_coeur },
        { transaction: t }
      );
      await film.setGenres(genres, { transaction: t });
      return Film.findByPk(film.id, {
        include: [{ model: Genre, as: 'genres', attributes: ['id', 'nom'], through: { attributes: [] } }],
        transaction: t,
      });
    });

    res.status(201).json({ success: true, message: 'Film créé avec succès', data: filmComplet });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(', ')
      });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Un ou plusieurs genres sont inexistants'
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
      date_ajout, coup_coeur, genre_id
    } = req.body;

    // Validation AVANT toute ecriture : si les genres sont fournis, il en faut au moins un valide.
    let genres;
    if (genre_id !== undefined) {
      genres = Array.isArray(genre_id) ? genre_id : [genre_id];
      if (genres.length === 0 || genres.some((g) => !g)) {
        return res.status(400).json({
          success: false,
          message: 'Un film doit conserver au moins un genre'
        });
      }
    }

    // Modification du film et de ses genres dans une seule transaction.
    // film.update(), pas findByPk(id, data, options) — cette derniere forme ne sauvegarde rien.
    await sequelize.transaction(async (t) => {
      await film.update({
        ...(titre !== undefined && { titre }),
        ...(description !== undefined && { description }),
        ...(affiche !== undefined && { affiche }),
        ...(age_min !== undefined && { age_min }),
        ...(duree !== undefined && { duree }),
        ...(date_ajout !== undefined && { date_ajout }),
        ...(coup_coeur !== undefined && { coup_coeur }),
      }, { transaction: t });

      if (genres) {
        await film.setGenres(genres, { transaction: t });
      }
    });

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
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Un ou plusieurs genres sont inexistants'
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