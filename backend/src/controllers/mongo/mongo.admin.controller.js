// src/controllers/admin.mongo.controller.js
import MongoReservation from "./mongo.reservation.model.js";
import mongoose from "mongoose";

export const dashboardReservations = async (req, res) => {
  try {
    console.log(' dashboardReservations appelé');
    // Calcul de la date limite (J - 7)
    const days = parseInt(req.query.days, 10) || 7;
    const now = new Date();
    const fromDate = new Date();
    fromDate.setDate(now.getDate() - days);

    console.log(` Recherche des réservations depuis ${fromDate.toISOString()}`);

    // Vérification : la collection existe-t-elle ?
    const count = await MongoReservation.countDocuments();
    console.log(`Nombre total de réservations: ${count}`);

    // Si aucune réservation, retourner un tableau vide
    if (count === 0) {
      console.log('Aucune réservation trouvée dans la collection');
      return res.status(200).json({
        from: fromDate.toISOString().split("T")[0],
        to: now.toISOString().split("T")[0],
        stats: [],
        message: "Aucune réservation trouvée"
      });
    }

    // Agrégation MongoDB avec timeout explicite
    const stats = await MongoReservation.aggregate([
      {
        $match: {
          date_reservation: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: "$titre",
          totalReservations: { $sum: "$nb_places" }
        }
      },
      { $sort: { totalReservations: -1 } }
    ],
    {
      maxTimeMS:30000,
      allowDiskUse:true
    
    });

    console.log(` Stats récupérées: ${stats.length} films trouvés`);

    // Construction de la réponse
    res.status(200).json({
      from: fromDate.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
      stats: stats.map(s => ({
        film: s._id,
        totalReservations: s.totalReservations
      }))
    });
  } catch (error) {
    console.error(" Erreur dashboardReservations:", error);
    
    // Gestion spécifique des erreurs
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(503).json({
        message: "Timeout: la base de données met trop de temps à répondre",
        details: "Vérifiez que MongoDB est bien démarré et accessible"
      });
    }
    
    if (error.name === 'MongoServerError') {
      return res.status(500).json({
        message: "Erreur MongoDB",
        details: error.message
      });
    }
    
    res.status(500).json({
      message: "Erreur serveur lors du chargement des statistiques",
      error: error.message
    });
  }
};
   


