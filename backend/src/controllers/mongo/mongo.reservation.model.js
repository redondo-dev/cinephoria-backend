
import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  film_id: { type: Number, required: true },
  titre: { type: String, required: true },
  nb_places: { type: Number, required: true },
  date_reservation: { type: Date, default: Date.now },
},
    {
    collection: "reservations", // nom de la collection MongoDB
    timestamps: false,          
    versionKey: false,          
  }
);

const MongoReservation = mongoose.model("Reservation", reservationSchema, "reservations");

export default MongoReservation;
