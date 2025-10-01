// src/controllers/admin.mongo.controller.js
import MongoReservation from "./mongo.reservation.model.js";

// Statistiques réservations 7 derniers jours
export const dashboardReservations = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await MongoReservation.aggregate([
      { $match: { date_reservation: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: "$titre",
          totalReservations: { $sum: "$nb_places" }
        }
      },
      { $sort: { totalReservations: -1 } }
    ]);

   res.json({
      from: sevenDaysAgo.toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
      stats: stats.map(s => ({
        film: s._id,
        totalReservations: s.totalReservations
      }))
    });



  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
