// controllers/seance.controller.js
// Contrôleur UNIQUE pour la gestion des séances (CRUD back-office), partagé par
// /api/admin et /api/employee. L'autorisation (isAdmin / isAdminOrEmploye) est
// gérée au niveau des routes, pas ici.


import { Seance, Film, Salle, Reservation } from '../models/index.js';
import { Op } from 'sequelize';

const DUREE_NETTOYAGE_MINUTES = 30;

// ======================================================
// Récupérer toutes les séances (filtres optionnels)
// ======================================================
export const getAllSeances = async (req, res) => {
  try {
    const { filmId, salleId, dateDebut, dateFin, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (filmId) where.filmId = filmId;
    if (salleId) where.salleId = salleId;
    if (dateDebut || dateFin) {
      where.dateHeureDebut = {};
      if (dateDebut) where.dateHeureDebut[Op.gte] = new Date(dateDebut);
      if (dateFin) where.dateHeureDebut[Op.lte] = new Date(dateFin);
    }

    const { count, rows: seances } = await Seance.findAndCountAll({
      where,
      include: [
        { model: Film, as: 'film', attributes: ['id', 'titre', 'duree', 'affiche'] },
        { model: Salle, as: 'salle', attributes: ['id', ['nom_salle', 'nom_salle'], ['capacite', 'capacite'], ['qualite_projection', 'qualite_projection']] },
        { model: Reservation, as: 'reservations', attributes: ['id', 'nb_places'], required: false },
      ],
      order: [['dateHeureDebut', 'ASC']],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    const data = seances.map((s) => {
      const placesReservees = s.reservations?.reduce((t, r) => t + (r.nb_places || 0), 0) || 0;
      const capaciteSalle = s.salle?.dataValues?.capacite || 0;
      const filmTitre = s.film?.titre || 'Film inconnu';
      const salleNom = s.salle?.dataValues?.nom_salle || 'Salle inconnue';
      return {
        id: s.id,
        // Superset de champs : deux frontends consomment ce même endpoint avec des attentes
        // différentes — seance-list.component.ts (admin) veut film/salle en chaînes simples,
        // employes.service.ts veut filmId/salleId numériques + filmTitre/salleNom optionnels.
        // On fournit les deux plutôt que de choisir un seul consommateur au détriment de l'autre.
        film: filmTitre,
        salle: salleNom,
        filmTitre,
        salleNom,
        film_id: s.film?.id,
        salle_id: s.salle?.id,
        filmId: s.film?.id,
        salleId: s.salle?.id,
        dateSeance: s.dateHeureDebut,
        heureDebut: s.dateHeureDebut,
        heureFin: s.dateHeureFin,
        dateHeureDebut: s.dateHeureDebut,
        dateHeureFin: s.dateHeureFin,
        capacite: capaciteSalle,
        placesDisponibles: capaciteSalle - placesReservees,
      };
    });

    res.status(200).json({ success: true, data, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    console.error('Erreur getAllSeances:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des séances', error: error.message });
  }
};

// ======================================================
// Récupérer une séance par ID
// ======================================================
export const getSeanceById = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id, {
      include: [
        { model: Film, as: 'film', attributes: ['id', 'titre', 'duree', 'affiche'] },
        { model: Salle, as: 'salle', attributes: ['id', ['nom_salle', 'nom_salle'], ['capacite', 'capacite'], ['qualite_projection', 'qualite_projection']] },
      ],
    });

    if (!seance) {
      return res.status(404).json({ success: false, message: 'Séance non trouvée' });
    }

    res.status(200).json({ success: true, data: seance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la séance', error: error.message });
  }
};

// ======================================================
// Détecter un conflit d'horaire dans une salle
// (factorisé : utilisé par createSeance ET updateSeance)
// ======================================================
async function trouverConflitHoraire({ salleId, dateDebut, dateFin, excludeId = null }) {
  const where = {
    salleId,
    [Op.or]: [
      { dateHeureDebut: { [Op.lte]: dateDebut }, dateHeureFin: { [Op.gt]: dateDebut } },
      { dateHeureDebut: { [Op.lt]: dateFin }, dateHeureFin: { [Op.gte]: dateFin } },
      { dateHeureDebut: { [Op.gte]: dateDebut }, dateHeureFin: { [Op.lte]: dateFin } },
    ],
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Seance.findOne({ where });
}

// ======================================================
// Créer une nouvelle séance
// ======================================================
export const createSeance = async (req, res) => {
  try {
 
    const filmId = req.body.filmId ?? req.body.film_id;
    const salleId = req.body.salleId ?? req.body.salle_id;
    const { dateHeureDebut } = req.body;

    if (!filmId || !salleId || !dateHeureDebut) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs requis (filmId, salleId, dateHeureDebut)'
      });
    }

    const film = await Film.findByPk(filmId);
    if (!film) {
      return res.status(404).json({ success: false, message: 'Film non trouvé' });
    }

    const salle = await Salle.findByPk(salleId);
    if (!salle) {
      return res.status(404).json({ success: false, message: 'Salle non trouvée' });
    }

    const dateDebut = new Date(dateHeureDebut);
    if (dateDebut < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La date et heure de la séance ne peuvent pas être dans le passé'
      });
    }

    // Fin de séance = durée du film + temps de nettoyage/battement entre deux séances.
    const dateFin = new Date(dateDebut.getTime() + (film.duree + DUREE_NETTOYAGE_MINUTES) * 60000);

    const conflit = await trouverConflitHoraire({ salleId, dateDebut, dateFin });
    if (conflit) {
      return res.status(409).json({
        success: false,
        message: "Un conflit d'horaire existe avec une autre séance dans cette salle"
      });
    }

    const seance = await Seance.create({
      filmId,
      salleId,
      dateHeureDebut: dateDebut,
      dateHeureFin: dateFin,
    });

    const seanceComplete = await Seance.findByPk(seance.id, {
      include: [
        { model: Film, as: 'film', attributes: ['id', 'titre', 'duree', 'affiche'] },
        { model: Salle, as: 'salle', attributes: ['id', ['nom_salle', 'nom_salle'], ['capacite', 'capacite'], ['qualite_projection', 'qualite_projection']] },
      ],
    });

    res.status(201).json({ success: true, message: 'Séance créée avec succès', data: seanceComplete });
  } catch (error) {
    console.error('Erreur createSeance:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la séance', error: error.message });
  }
};

// ======================================================
// Mettre à jour une séance
// ======================================================
export const updateSeance = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id);
    if (!seance) {
      return res.status(404).json({ success: false, message: 'Séance non trouvée' });
    }

    if (seance.dateHeureDebut < new Date()) {
      return res.status(400).json({ success: false, message: 'Impossible de modifier une séance passée' });
    }

    const filmId = req.body.filmId ?? req.body.film_id;
    const salleId = req.body.salleId ?? req.body.salle_id;
    const { dateHeureDebut } = req.body;

    const film = filmId ? await Film.findByPk(filmId) : await Film.findByPk(seance.filmId);
    if (!film) {
      return res.status(404).json({ success: false, message: 'Film non trouvé' });
    }

    const salle = salleId ? await Salle.findByPk(salleId) : await Salle.findByPk(seance.salleId);
    if (!salle) {
      return res.status(404).json({ success: false, message: 'Salle non trouvée' });
    }

    const dateDebut = dateHeureDebut ? new Date(dateHeureDebut) : seance.dateHeureDebut;
    const dateFin = new Date(dateDebut.getTime() + (film.duree + DUREE_NETTOYAGE_MINUTES) * 60000);

    const conflit = await trouverConflitHoraire({
      salleId: salle.id,
      dateDebut,
      dateFin,
      excludeId: seance.id,
    });
    if (conflit) {
      return res.status(409).json({
        success: false,
        message: "Un conflit d'horaire existe avec une autre séance dans cette salle"
      });
    }

    await seance.update({
      filmId: film.id,
      salleId: salle.id,
      dateHeureDebut: dateDebut,
      dateHeureFin: dateFin,
    });

    const seanceComplete = await Seance.findByPk(seance.id, {
      include: [
        { model: Film, as: 'film', attributes: ['id', 'titre', 'duree', 'affiche'] },
        { model: Salle, as: 'salle', attributes: ['id', ['nom_salle', 'nom_salle'], ['capacite', 'capacite'], ['qualite_projection', 'qualite_projection']] },
      ],
    });

    res.status(200).json({ success: true, message: 'Séance mise à jour avec succès', data: seanceComplete });
  } catch (error) {
    console.error('Erreur updateSeance:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la séance', error: error.message });
  }
};

// ======================================================
// Supprimer une séance
// ======================================================
export const deleteSeance = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id);
    if (!seance) {
      return res.status(404).json({ success: false, message: 'Séance non trouvée' });
    }

    const reservationsCount = await Reservation.count({ where: { seance_id: seance.id } });
    if (reservationsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette séance car ${reservationsCount} réservation(s) y sont associées`
      });
    }

    await seance.destroy();
    res.status(200).json({ success: true, message: 'Séance supprimée avec succès' });
  } catch (error) {
    console.error('Erreur deleteSeance:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la séance', error: error.message });
  }
};

// ======================================================
// Supprimer plusieurs séances en une fois (sélection multiple)
// Chaque séance ayant encore des réservations liées est ignorée, jamais supprimée
// de force — même garde-fou que la suppression unitaire, appliqué à chaque élément.

// ======================================================
export const bulkDeleteSeances = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun identifiant de séance fourni' });
    }

    const seances = await Seance.findAll({ where: { id: ids }, attributes: ['id'] });
    const foundIds = seances.map((s) => s.id);

    const reservationsRows = await Reservation.findAll({
      attributes: [
        'seance_id',
        [Reservation.sequelize.fn('COUNT', Reservation.sequelize.col('id')), 'nb'],
      ],
      where: { seance_id: foundIds },
      group: ['seance_id'],
      raw: true,
    });
    const blockedIds = reservationsRows
      .filter((r) => parseInt(r.nb, 10) > 0)
      .map((r) => r.seance_id);
    const deletableIds = foundIds.filter((id) => !blockedIds.includes(id));

    const deletedCount = deletableIds.length > 0
      ? await Seance.destroy({ where: { id: deletableIds } })
      : 0;

    res.status(200).json({
      success: true,
      deletedCount,
      blockedCount: blockedIds.length,
      blockedIds,
      message: blockedIds.length > 0
        ? `${deletedCount} séance(s) supprimée(s). ${blockedIds.length} ignorée(s) car des réservations y sont associées.`
        : `${deletedCount} séance(s) supprimée(s) avec succès.`,
    });
  } catch (error) {
    console.error('Erreur bulkDeleteSeances:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression groupée', error: error.message });
  }
};

// ======================================================
// Vérifier les places disponibles pour une séance
// ======================================================
export const checkSeanceAvailability = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id, {
      include: [
        { model: Salle, as: 'salle', attributes: [['capacite', 'capacite']] },
        { model: Reservation, as: 'reservations', attributes: ['nb_places'], required: false },
      ],
    });
    if (!seance) {
      return res.status(404).json({ success: false, message: 'Séance non trouvée' });
    }

    const placesOccupees = seance.reservations?.reduce((t, r) => t + (r.nb_places || 0), 0) || 0;
    const capaciteTotal = seance.salle?.dataValues?.capacite || 0;

    res.status(200).json({
      success: true,
      data: { capaciteTotal, placesOccupees, placesDisponibles: capaciteTotal - placesOccupees }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};