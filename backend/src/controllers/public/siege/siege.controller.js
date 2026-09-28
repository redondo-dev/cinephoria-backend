// src/controllers/public/siege/siege.controller.js

import { Op } from "sequelize";
import { Seance, Salle, Siege, Billet, Reservation } from "../../../models/index.js";

// Récupérer les sièges disponibles d'une séance
export const getSiegesDisponibles = async (req, res) => {
  try {
    const { id } = req.params;

    const seance = await Seance.findByPk(id, {
      include: {
        model: Salle,
        as: 'salle',
        attributes: [
          'id',
          ['nom_salle', 'nom_salle'],
          ['capacite', 'capacite'],
          ['qualite_projection', 'qualite_projection'],
        ]
      }
    });

    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }

    if (!seance.salle) {
      return res.status(404).json({ message: 'Salle associée à la séance introuvable' });
    }

    const sieges = await Siege.findAll({
      where: { salle_id: seance.salle.id },
      attributes: ['id', 'numero_siege', 'rangee', 'type_siege'],
      order: [['rangee', 'ASC'], ['numero_siege', 'ASC']]
    });

    // Sièges occupés = billets actifs (non annulés) sur cette séance.
    const billetsActifs = await Billet.findAll({
      where: {
        seance_id: id,
        statut_billet: { [Op.ne]: 'annule' },
      },
      attributes: ['siege_id'],
    });

    const siegesReservesIds = new Set(billetsActifs.map(b => b.siege_id));

    const siegesAvecDisponibilite = sieges.map(siege => ({
      id: siege.id,
      numero: siege.numero_siege,
      rangee: siege.rangee,
      type: siege.type_siege,
      disponible: !siegesReservesIds.has(siege.id)
    }));

    res.json({
      salle: {
        id: seance.salle.id,
        nom: seance.salle.dataValues.nom_salle,
        capacite: seance.salle.dataValues.capacite,
        qualiteProjection: seance.salle.dataValues.qualite_projection
      },
      sieges: siegesAvecDisponibilite
    });

  } catch (error) {
    console.error("Erreur getSiegesDisponibles:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des sièges" });
  }
};