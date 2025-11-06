
import { Seance, Salle, Siege, Reservation } from "../../../models/index.js";

// 🔹 Récupérer les sièges disponibles d'une séance
export const getSiegesDisponibles = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️- Récupérer la séance avec sa salle
    const seance = await Seance.findByPk(id, {
      include: {
        model: Salle,
        as: 'salle',
        attributes: ['id', 'nom_salle', 'capacite', 'qualite_projection']
      }
    });

    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    // 2️-Récupérer tous les sièges de la salle
    const sieges = await Siege.findAll({
      where: { salle_id: seance.salle.id },
      attributes: ['id', 'numero_siege', 'rangee', 'type_siege'],
      order: [['rangee', 'ASC'], ['numero_siege', 'ASC']]
    });

    // 3️- Récupérer les réservations de la séance avec les sièges associés (N-N)
    const reservations = await Reservation.findAll({
      where: { seance_id: id },
      include: {
        model: Siege,
        as: 'siegesReserves', // alias N-N
        through: { attributes: [] }, 
        attributes: ['id', 'numero_siege', 'rangee']
      }
    });

    // 4️- Construire un set des IDs de sièges réservés
    const siegesReservesIds = new Set(
      reservations.flatMap(r => r.siegesReserves.map(s => s.id))
    );

    // 5️- Marquer chaque siège comme disponible ou non
    const siegesAvecDisponibilite = sieges.map(siege => ({
      id: siege.id,
      numero: siege.numero_siege,
      rangee: siege.rangee,
      type: siege.type_siege,
      disponible: !siegesReservesIds.has(siege.id)
    }));

    // 6️- Retourner la salle + les sièges avec leur disponibilité
    res.json({
      salle: {
        id: seance.salle.id,
        nom: seance.salle.nom_salle,
        capacite: seance.salle.capacite,
        qualiteProjection: seance.salle.qualite_projection
      },
      sieges: siegesAvecDisponibilite
    });

  } catch (error) {
    console.error("Erreur getSiegesDisponibles:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des sièges" });
  }
};


// Calculer le prix d'une réservation
export const calculerPrix = async (req, res) => {
  try {
    const { seanceId, nbPersonnes } = req.body;

    if (!seanceId || !nbPersonnes) {
      return res.status(400).json({ 
        message: "seanceId et nbPersonnes sont requis" 
      });
    }

    if (nbPersonnes < 1) {
      return res.status(400).json({ 
        message: "Le nombre de personnes doit être au moins 1" 
      });
    }

    const seance = await Seance.findByPk(seanceId, {
      attributes: ['prix'],
      include: {
        model: Salle,
        attributes: ['qualite_projection']
      }
    });

    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    const prixUnitaire = parseFloat(seance.prix);
    const prixTotal = prixUnitaire * nbPersonnes;

    res.json({ 
      prixUnitaire: prixUnitaire.toFixed(2), 
      prixTotal: prixTotal.toFixed(2),
      qualiteProjection: seance.Salle.qualite_projection,
      nbPersonnes
    });
  } catch (error) {
    console.error("Erreur calculerPrix:", error);
    res.status(500).json({ message: "Erreur lors du calcul du prix" });
  }
};