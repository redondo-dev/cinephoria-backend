// src/middleware/turnstile.middleware.js

export const verifyTurnstile = async (req, res, next) => {
  console.log('🔑 Secret Key:', process.env.TURNSTILE_SECRET_KEY); 
  console.log('📦 Token reçu:', req.body.captchaToken); 
  const token = req.body.captchaToken;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'CAPTCHA manquant. Veuillez valider le CAPTCHA.'
    });
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: req.ip
        })
      }
    );

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA invalide. Veuillez réessayer.'
      });
    }

    next(); // ✅ CAPTCHA valide, on continue
  } catch (error) {
    console.error('Erreur vérification Turnstile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du CAPTCHA.'
    });
  }
};

