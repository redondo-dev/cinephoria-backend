// src/routes/payment.routes.js
import express from 'express';
import { createPaymentIntent, handleWebhook } from '../controllers/payment.controller.js';

const router = express.Router();
 
router.post('/webhook', handleWebhook);

// Créer un PaymentIntent
router.post('/create-payment-intent', createPaymentIntent);

export default router;