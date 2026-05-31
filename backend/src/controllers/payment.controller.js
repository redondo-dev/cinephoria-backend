// src/controllers/payment.controller.js
import Stripe from 'stripe';

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
      amount: Math.round(montant * 100), // Stripe travaille en centimes
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        seance_id: String(reservationData?.seance_id || ''),
        utilisateur_id: String(reservationData?.utilisateur_id || ''),
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
      req.rawBody, // nécessite express.raw() sur cette route
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature invalide :', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Paiement confirmé :', paymentIntent.id);
      // Optionnel : créer la réservation ici de façon fiable
      break;

    case 'payment_intent.payment_failed':
      console.error('❌ Paiement échoué :', event.data.object.id);
      break;

    default:
      console.log(`Événement Stripe non géré : ${event.type}`);
  }

  res.json({ received: true });
};