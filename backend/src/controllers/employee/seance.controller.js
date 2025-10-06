// controllers/employee/seance.controller.js
import { Op } from 'sequelize';
import Seance from '../../models/seance.model.js';
import Film from '../../models/film.model.js';
import Salle from '../../models/salle.model.js';
import Reservation from '../../models/reservation.model.js'; // Pour suppression

// Récupérer toutes les séances
export const getAllSeances = async (req, res) => {
  try {
    const { filmId, salleId, dateDebut, dateFin } = req.query;

    const where = {};
    if (filmId) where.filmId = filmId;
    if (salleId) where.salleId = salleId;
    if (dateDebut || dateFin) {
      where.dateHeureDebut = {};
      if (dateDebut) where.dateHeureDebut[Op.gte] = new Date(dateDebut);
      if (dateFin) where.dateHeureDebut[Op.lte] = new Date(dateFin);
    }

    const seances = await Seance.findAll({
      where,
      include: [
        { model: Film, as: 'film', attributes: ['titre', 'duree', 'genre_id', 'affiche'] },
        { model: Salle, as :"salle", attributes: ['nom_salle', 'capacite', 'qualite_projection'] }
      ],
      order: [['dateHeureDebut', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: seances.length,
      data: seances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des séances',
      error: error.message
    });
  }
};

// Récupérer une séance par ID
export const getSeanceById = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id, {
      include: [
        { model: Film, as: 'film', attributes: ['titre', 'duree', 'genre_id', 'affiche'] },
        { model: Salle, as: 'salle', attributes: ['nom_salle', 'capacite', 'qualite_projection'] }
      ]
    });

    if (!seance) {
      return res.status(404).json({
        success: false,
        message: 'Séance non trouvée'
      });
    }

    res.status(200).json({ success: true, data: seance });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la séance',
      error: error.message
    });
  }
};



// Créer une nouvelle séance
export const createSeance = async (req, res) => {
  try {
    const { date_seance, film_id, salle_id } = req.body;

    // Validation des champs
    if (!film_id || !salle_id || !date_seance) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs requis (film_id, salle_id, date_seance)'
      });
    }

    // Vérification du film
    const film = await Film.findByPk(film_id);
    if (!film) {
      return res.status(404).json({ 
        success: false, 
        message: 'Film non trouvé' 
      });
    }

    // Vérification de la salle
    const salle = await Salle.findByPk(salle_id);
    if (!salle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Salle non trouvée' 
      });
    }

    // Validation de la date
    const dateDebut = new Date(date_seance);
    if (dateDebut < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La date et heure de la séance ne peuvent pas être dans le passé'
      });
    }

    // Extraire juste la date (YYYY-MM-DD) pour date_seance
    const dateOnly = dateDebut.toISOString().split('T')[0];

    // Calcul de la date de fin : durée du film + 30 min nettoyage
    const dateFin = new Date(dateDebut.getTime() + film.duree * 60000 + 30 * 60000);

    // Vérification des conflits
    const conflictSeance = await Seance.findOne({
      where: {
        salle_id,
        [Op.or]: [
          {
            dateHeureDebut: { [Op.lte]: dateDebut },
            dateHeureFin: { [Op.gt]: dateDebut }
          },
          {
            dateHeureDebut: { [Op.lt]: dateFin },
            dateHeureFin: { [Op.gte]: dateFin }
          },
          {
            dateHeureDebut: { [Op.gte]: dateDebut },
            dateHeureFin: { [Op.lte]: dateFin }
          }
        ]
      }
    });

    if (conflictSeance) {
      return res.status(400).json({
        success: false,
        message: 'Un conflit d\'horaire existe avec une autre séance dans cette salle'
      });
    }

    // Création de la séance (ne pas inclure l'id, il sera auto-généré)
    const seance = await Seance.create({
      film_id,
      salle_id,
      date_seance: dateOnly,           // Date seule (YYYY-MM-DD)
      dateHeureDebut: dateDebut,       // Date avec heure complète
      dateHeureFin: dateFin            // Date de fin avec heure
    
    });

    // Récupérer les relations pour renvoyer
    const seancePopulated = await Seance.findByPk(seance.id, {
      include: [
        { 
          model: Film, 
          as: 'film', 
          attributes: ['titre', 'duree', 'genre_id', 'affiche'] 
        },
        { 
          model: Salle, 
          as: 'salle', 
          attributes: ['nom_salle', 'capacite', 'qualite_projection'] 
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Séance créée avec succès',
      data: seancePopulated
    });
  } catch (error) {
    console.error('Erreur createSeance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la séance',
      error: error.message
    });
  }
};

// Mettre à jour une séance
export const updateSeance = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id);
    if (!seance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Séance non trouvée' 
      });
    }

    // Vérifier si la séance n'est pas passée
    if (seance.dateHeureDebut < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Impossible de modifier une séance passée' 
      });
    }

    const { film_id, salle_id, date_seance } = req.body;

    // Déterminer la nouvelle date ou garder l'ancienne
    let dateDebut = date_seance ? new Date(date_seance) : seance.dateHeureDebut;
    
    // Extraire juste la date (YYYY-MM-DD)
    const dateOnly = dateDebut.toISOString().split('T')[0];
    
    // Récupérer le film (nouveau ou existant)
    const film = film_id 
      ? await Film.findByPk(film_id) 
      : await Film.findByPk(seance.film_id);
    
    if (!film) {
      return res.status(404).json({ 
        success: false, 
        message: 'Film non trouvé' 
      });
    }

    // Récupérer la salle (nouvelle ou existante)
    const salle = salle_id 
      ? await Salle.findByPk(salle_id) 
      : await Salle.findByPk(seance.salle_id);
    
    if (!salle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Salle non trouvée' 
      });
    }

    // Calculer la date de fin
    const dateFin = new Date(dateDebut.getTime() + film.duree * 60000 + 30 * 60000);

    // Vérification des conflits (exclure la séance actuelle)
    const conflictSeance = await Seance.findOne({
      where: {
        id: { [Op.ne]: seance.id },
        salle_id: salle.id,
        [Op.or]: [
          { 
            dateHeureDebut: { [Op.lte]: dateDebut }, 
            dateHeureFin: { [Op.gt]: dateDebut } 
          },
          { 
            dateHeureDebut: { [Op.lt]: dateFin }, 
            dateHeureFin: { [Op.gte]: dateFin } 
          },
          { 
            dateHeureDebut: { [Op.gte]: dateDebut }, 
            dateHeureFin: { [Op.lte]: dateFin } 
          }
        ]
      }
    });

    if (conflictSeance) {
      return res.status(400).json({
        success: false,
        message: 'Un conflit d\'horaire existe avec une autre séance dans cette salle'
      });
    }

    // Mise à jour de la séance
    await seance.update({
      film_id: film.id,
      salle_id: salle.id,
      date_seance: dateOnly,         // Date seule (YYYY-MM-DD)
      dateHeureDebut: dateDebut,     // Date avec heure complète
      dateHeureFin: dateFin          // Date de fin avec heure
    
    });

    // Récupérer la séance mise à jour avec les relations
    const seancePopulated = await Seance.findByPk(seance.id, {
      include: [
        { 
          model: Film, 
          as: 'film', 
          attributes: ['titre', 'duree', 'genre_id', 'affiche'] 
        },
        { 
          model: Salle, 
          as: 'salle', 
          attributes: ['nom_salle', 'capacite', 'qualite_projection'] 
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Séance mise à jour avec succès',
      data: seancePopulated
    });
  } catch (error) {
    console.error('Erreur updateSeance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la séance',
      error: error.message
    });
  }
};

export const deleteSeance = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id);
    if (!seance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Séance non trouvée' 
      });
    }

    // Vérifier si des réservations existent
    const reservationsCount = await Reservation.count({ 
      where: { seance_id: seance.id } 
    });
    
    if (reservationsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette séance car ${reservationsCount} réservation(s) y sont associées`
      });
    }

    await seance.destroy();

    res.status(200).json({
      success: true,
      message: 'Séance supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteSeance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la séance',
      error: error.message
    });
  }
};
