// controllers/genre.controller.js

import { Genre, FilmGenre } from '../models/index.js';

// ======================================================
// Récupérer tous les genres (lecture publique : utile pour
// peupler le filtre "Genre" de la page Films, US5, et le
// sélecteur du formulaire de création de film, US8/US9)
// ======================================================
export const getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.findAll({ order: [['nom', 'ASC']] });
    res.status(200).json({ success: true, count: genres.length, data: genres });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des genres',
      error: error.message
    });
  }
};

// ======================================================
// Récupérer un genre par ID
// ======================================================
export const getGenreById = async (req, res) => {
  try {
    const genre = await Genre.findByPk(req.params.id);
    if (!genre) {
      return res.status(404).json({ success: false, message: 'Genre non trouvé' });
    }
    res.status(200).json({ success: true, data: genre });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du genre',
      error: error.message
    });
  }
};

// ======================================================
// Créer un nouveau genre (admin / employé)
// ======================================================
export const createGenre = async (req, res) => {
  try {
    const { nom, description } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom du genre est obligatoire' });
    }

    const genreExistant = await Genre.findOne({ where: { nom: nom.trim() } });
    if (genreExistant) {
      return res.status(400).json({ success: false, message: 'Un genre avec ce nom existe déjà' });
    }

    const genre = await Genre.create({ nom: nom.trim(), description });
    res.status(201).json({ success: true, message: 'Genre créé avec succès', data: genre });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du genre',
      error: error.message
    });
  }
};

// ======================================================
// Mettre à jour un genre (admin / employé)
// ======================================================
export const updateGenre = async (req, res) => {
  try {
    const genre = await Genre.findByPk(req.params.id);
    if (!genre) {
      return res.status(404).json({ success: false, message: 'Genre non trouvé' });
    }

    const { nom, description } = req.body;

    if (nom && nom.trim() !== genre.nom) {
      const genreExistant = await Genre.findOne({ where: { nom: nom.trim() } });
      if (genreExistant) {
        return res.status(400).json({ success: false, message: 'Un genre avec ce nom existe déjà' });
      }
    }

    await genre.update({
      ...(nom && { nom: nom.trim() }),
      ...(description !== undefined && { description }),
    });

    res.status(200).json({ success: true, message: 'Genre mis à jour avec succès', data: genre });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du genre',
      error: error.message
    });
  }
};

// ======================================================
// Supprimer un genre (admin / employé)
// Refuse la suppression si des films utilisent encore ce genre,
// même logique de sécurité que deleteSalle / deleteFilm.
// ======================================================
export const deleteGenre = async (req, res) => {
  try {
    const genre = await Genre.findByPk(req.params.id);
    if (!genre) {
      return res.status(404).json({ success: false, message: 'Genre non trouvé' });
    }

    const filmsCount = await FilmGenre.count({ where: { genre_id: req.params.id } });
    if (filmsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce genre car ${filmsCount} film(s) l'utilisent encore`
      });
    }

    await genre.destroy();
    res.status(200).json({ success: true, message: 'Genre supprimé avec succès' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du genre',
      error: error.message
    });
  }
};