// models/Commande.js
import { Schema, model } from 'mongoose';

const commandeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reservations: [{
    type: Schema.Types.ObjectId,
    ref: 'Reservation'
  }],
  montantTotal: {
    type: Number,
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmée', 'annulée', 'terminée'],
    default: 'en_attente'
  },
  moyenPaiement: {
    type: String,
    enum: ['carte_bancaire', 'paypal', 'especes']
  }
}, {
  timestamps: true
});

export default model('Commande', commandeSchema);
