// src/controllers/payment.controller.js
import Stripe from 'stripe';
import { Reservation, Billet } from '../models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/payments/create-payment-intent
 * Crée un PaymentIntent Stripe et retourne le clientSecret au frontend
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { montant, reservationData } = req.body;

    if (!montant || montant <= 0) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(montant * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        seance_id: String(reservationData?.seance_id || ''),
        utilisateur_id: String(reservationData?.utilisateur_id || ''),
        reservation_id: String(reservationData?.reservation_id || ''),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Erreur Stripe PaymentIntent :', error.message);
    res.status(500).json({ message: 'Erreur Stripe', error: error.message });
  }
};

/**
 * POST /api/payments/webhook
 * Webhook Stripe — à brancher si vous voulez créer la réservation côté serveur
 * après confirmation du paiement (recommandé en production)
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature invalide :', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const reservation_id = paymentIntent.metadata?.reservation_id;

      if (reservation_id) {
        await Reservation.update(
          { statut_reservation: 'confirmee' },
          { where: { id: reservation_id } }
        );

        const [nbBilletsMisAJour] = await Billet.update(
          { statut_billet: 'valide' },
          { where: { reservation_id, statut_billet: 'en_attente' } }
        );
        console.log(`✅ Réservation #${reservation_id} confirmée — ${nbBilletsMisAJour} billet(s) validé(s)`);
      } else {
        console.warn('⚠️ Webhook succeeded reçu sans reservation_id dans metadata');
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const reservation_id = paymentIntent.metadata?.reservation_id;

      if (reservation_id) {
        await Reservation.update(
          { statut_reservation: 'annulee' },
          { where: { id: reservation_id } }
        );

        // Billets annulés -> l'index unique partiel les exclut,
        // les sièges redeviennent immédiatement réservables par quelqu'un d'autre.
        const [nbBilletsAnnules] = await Billet.update(
          { statut_billet: 'annule' },
          { where: { reservation_id, statut_billet: 'en_attente' } }
        );
        console.log(`❌ Réservation #${reservation_id} annulée — ${nbBilletsAnnules} billet(s) annulé(s)`);
      } else {
        console.warn('⚠️ Webhook payment_failed reçu sans reservation_id dans metadata');
      }
      break;
    }

    default:
      console.log(`Événement Stripe non géré : ${event.type}`);
  }

  res.json({ received: true });
};