// backend/src/controllers/seances.controller.js
import { Seance,Film, Salle,Reservation } from '../../models/index.js'
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
      data: {
        capaciteTotal: seance.salle.capacite,
        placesOccupees,
        placesDisponibles
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer toutes les séances

export const getAllSeances = async (req, res) => {
  try {
    const seances = await Seance.findAll({
      include: [
        {
          model: Film,
          as: 'film',
          attributes: ['id', 'titre']
        },
        {
          model: Salle,
          as: 'salle',
          attributes: ['id', ['nom_salle', 'nom'], 'capacite'] 
        },
        {
          model: Reservation,
          as: 'reservations',
          attributes: ['id', 'nb_places', 'prix_unitaire']
        }
      ],
      order: [['date_seance', 'ASC'], ['date_heure_debut', 'ASC']]
    });

    const result = seances.map(s => {
      const totalPlacesReservees = s.reservations?.reduce((t, r) => t + (r.nb_places || 0), 0) || 0;
      const placesDisponibles = (s.salle?.capacite || 0) - totalPlacesReservees;
      return {
        id: s.id,
        film: s.film?.titre || 'Inconnu',
        salle: s.salle?.nom || 'Inconnue',
        dateSeance: s.date_seance,
        heureDebut: s.dateHeureDebut,
        heureFin: s.dateHeureFin,
        prixMoyen:s.reservations?.length
          ? s.reservations.reduce((t, r) => t + r.prix_unitaire, 0) / s.reservations.length
          : 0,
        placesDisponibles,
        reservations: s.reservations?.map(r => ({
          nb_places: r.nb_places,
          prix_unitaire: r.prix_unitaire,
          prix_total: r.nb_places * r.prix_unitaire
        })) || []
      };
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error(" Erreur getAllSeances :", error);
    res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
  }
};

// Récupérer une séance par ID
export const getSeanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const seance = await Seance.findByPk(id);

    if (!seance) {
      return res.status(404).json({ message: "Séance non trouvée" });
    }

    res.status(200).json({ data: seance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
