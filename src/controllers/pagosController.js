const logger = require('../utils/logger');

let stripe = null;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (e) {
  logger.warn('Stripe no instalado o STRIPE_SECRET_KEY no definido. Instala: npm install stripe');
}

/**
 * POST /api/pagos/create-payment-intent
 * Body: { amount: number (total en pesos, ej. 150.50), currency?: 'mxn', metadata?: {} }
 * Devuelve: { clientSecret } para usar con Stripe.js confirmCardPayment / confirmPayment
 */
const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Pasarela de pago no configurada.'
      });
    }
    const { amount, currency = 'mxn', metadata = {} } = req.body;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser un número positivo.'
      });
    }
    // Stripe en MXN usa centavos (amount in smallest currency unit)
    const amountInCentavos = Math.round(amountNum * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCentavos,
      currency: (currency || 'mxn').toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { ...metadata }
    });
    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    logger.error('Error createPaymentIntent:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error al crear la intención de pago.'
    });
  }
};

module.exports = {
  createPaymentIntent
};
