// backend/src/controllers/admin/seance.controller.js
import { Seance, Film, Salle, Reservation } from '../../models/index.js';
import Cinema from '../../models/cinema.model.js';
import Tarif from '../../models/tarif.model.js';
import { Op } from 'sequelize';

// ========================================
// CRUD SÉANCES
// ========================================

// Création d'une séance
export const createSeance = async (req, res) => {
  try {
    const seance = await Seance.create(req.body);
    res.status(201).json({ message: "Séance créée avec succès", data: seance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mise à jour d'une séance
export const updateSeance = async (req, res) => {
  try {
    const { id } = req.params;
    const seance = await Seance.findByPk(id);
    if (!seance) {
      return res.status(404).json({ message: "Séance non trouvée" });
    }
    await seance.update(req.body);
    res.status(200).json({ message: "Séance mise à jour avec succès", data: seance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Suppression d'une séance
export const deleteSeance = async (req, res) => {
  try {
    const { id } = req.params;
  
    const seance = await Seance.findByPk(id);
  
    if (!seance) {
      return res.status(404).json({ message: "Séance non trouvée" });
    }
    await seance.destroy();

    res.status(200).json({ message: "Séance supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vérification des places disponibles
export const checkSeanceAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const seance = await Seance.findByPk(id, {
      include: ["salle", "reservations"]
    });
    if (!seance) {
      return res.status(404).json({ message: "Séance non trouvée" });
    }
    const placesOccupees = seance.reservations.reduce((total, r) => total + r.nombrePlaces, 0);
    const placesDisponibles = seance.salle.capacite - placesOccupees;
    res.status(200).json({
      data: { capaciteTotal: seance.salle.capacite, placesOccupees, placesDisponibles }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer toutes les séances (admin)
export const getAllSeances = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: seances } = await Seance.findAndCountAll({
      include: [
        { model: Film, as: 'film', attributes: ['id', 'titre'] },
        { model: Salle, as: 'salle', attributes: ['id', ['nom_salle', 'nom'], 'capacite'] },
        { model: Reservation, as: 'reservations', attributes: ['id', 'nb_places', 'prix_unitaire'] }
      ],
      order: [['dateHeureDebut', 'ASC']] ,
      limit,
      offset
    });

  const result = seances.map(s => {
      const totalPlacesReservees = s.reservations?.reduce((t, r) => t + (r.nb_places || 0), 0) || 0;
      return {
        id: s.id,
        film: s.film?.titre || 'Inconnu',
        salle: s.salle?.nom || 'Inconnue',
        heureDebut: s.dateHeureDebut,
        heureFin: s.dateHeureFin,
        placesDisponibles: (s.salle?.capacite || 0) - totalPlacesReservees,
      };
      console.log(typeof s.dateHeureDebut, s.dateHeureDebut);
    });
      

    res.status(200).json({ 
      data: result ,
      total:count,
      page,
      totalPages: Math.ceil(count / limit)

    });
  } catch (error) {
   
    res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
  }
};

// Récupérer une séance par ID
export const getSeanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const seance = await Seance.findByPk(id, {
      include: [
        { model: Film, as: 'film', attributes: ['id', 'titre'] },
        { model: Salle, as: 'salle', attributes: ['id', 'nom', 'nombrePlaces', 'qualiteProjection'] }
      ]
    });
    if (!seance) {
      return res.status(404).json({ message: "Séance non trouvée" });
    }
    res.status(200).json({ data: seance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================================
// ROUTES PUBLIQUES SÉANCES
// ========================================

// GET /api/seances/dates
export const getAvailableDates = async (req, res) => {
  try {
    const seances = await Seance.findAll({
      attributes: ['dateHeureDebut'],
      where: { dateHeureDebut: { [Op.gte]: new Date() } },
      order: [['dateHeureDebut', 'ASC']],
      raw: true
    });

    if (seances.length === 0) return res.status(200).json([]);

    const dateSet = new Set();
    seances.forEach(s => {
      if (s.date_heure_debut) {
        dateSet.add(new Date(s.date_heure_debut).toISOString().split('T')[0]);
      }
    });

    res.status(200).json(Array.from(dateSet).sort());
  } catch (error) {
    console.error('Erreur getAvailableDates:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des dates', error: error.message });
  }
};

// GET /api/seances/film/:filmId
export const getSeancesByFilm = async (req, res) => {
  try {
    const { filmId } = req.params;
    const seances = await Seance.findAll({
      where: { filmId, dateHeureDebut: { [Op.gte]: new Date() } },
      include: [
        {
          model: Salle, as: 'salle',
          attributes: ['id', 'nom_salle', 'capacite', 'qualite_projection'],
          include: [{ model: Cinema, as: 'cinema', attributes: ['id', 'nom', 'ville', 'adresse'] }]
        },
        { model: Film, as: 'film', attributes: ['id', 'titre'] }
      ],
      order: [['dateHeureDebut', 'ASC']]
    });

    const tarifs = await Tarif.findAll({ attributes: ['id', 'nom_tarif', 'type_tarif', 'prix_unitaire'] });

    const getPrixByQualite = (qualite, type = 'normal') => {
      const mapping = {
        'Standard': tarifs.find(t => t.type_tarif === type && t.nom_tarif.toLowerCase().includes('standard')),
        '3D': tarifs.find(t => t.type_tarif === type && t.nom_tarif.toLowerCase().includes('3d')),
        'IMAX': tarifs.find(t => t.type_tarif === type && t.nom_tarif.toLowerCase().includes('imax')),
        'VIP': tarifs.find(t => t.type_tarif === type && t.nom_tarif.toLowerCase().includes('vip'))
      };
      return mapping[qualite]?.prix_unitaire || 9.50;
    };

    const formattedSeances = seances.map(seance => {
      const qualite = seance.salle?.qualite_projection || 'Standard';
      return {
        id: seance.id,
        date: seance.dateHeureDebut.toISOString().split('T')[0],
        heure_debut: seance.dateHeureDebut.toISOString().substring(11, 16),
        heure_fin: seance.dateHeureFin.toISOString().substring(11, 16),
        qualite,
        prix: parseFloat(getPrixByQualite(qualite)),
        places_disponibles: seance.salle?.capacite || 0,
        salle: seance.salle?.nom_salle || 'N/A',
        cinema: seance.salle?.cinema?.nom || 'N/A',
        cinema_ville: seance.salle?.cinema?.ville || 'N/A'
      };
    });

    res.status(200).json(formattedSeances);
  } catch (error) {
    console.error('Erreur getSeancesByFilm:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des séances', error: error.message });
  }
};

// GET /api/seances (public avec filtres)
export const getPublicSeances = async (req, res) => {
  try {
    const { date, cinemaId, filmId } = req.query;
    const whereClause = { dateHeureDebut: { [Op.gte]: new Date() } };

    if (date) {
      whereClause.dateHeureDebut = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      };
    }
    if (filmId) whereClause.filmId = filmId;

    const includeClause = [
      {
        model: Salle, as: 'salle',
        attributes: ['id', 'nom_salle', 'capacite', 'qualite_projection'],
        include: [{
          model: Cinema, as: 'cinema',
          attributes: ['id', 'nom', 'ville'],
          ...(cinemaId && { where: { id: cinemaId } })
        }]
      },
      { model: Film, as: 'film', attributes: ['id', 'titre', 'affiche'] }
    ];

    const seances = await Seance.findAll({
      where: whereClause,
      include: includeClause,
      order: [['dateHeureDebut', 'ASC']]
    });

    res.status(200).json(seances);
  } catch (error) {
    console.error('Erreur getPublicSeances:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des séances', error: error.message });
  }
};