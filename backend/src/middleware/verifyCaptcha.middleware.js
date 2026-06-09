// middleware/verifyCaptcha.js
import axios from 'axios';

/**
 * Middleware Express — vérifie le token hCaptcha côté serveur
 * À appliquer sur toutes les routes auth sensibles (login, register)
 */
export const verifyCaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ message: 'CAPTCHA requis' });
  }

  try {
    const params = new URLSearchParams({
      secret: process.env.HCAPTCHA_SECRET,
      response: captchaToken,
    });

    const { data } = await axios.post(
      'https://hcaptcha.com/siteverify',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!data.success) {
      console.warn('hCaptcha échec:', data['error-codes']);
      return res.status(400).json({ message: 'CAPTCHA invalide ou expiré' });
    }

    next();
  } catch (err) {
    console.error('Erreur vérification hCaptcha:', err.message);
    return res.status(500).json({ message: 'Erreur de vérification CAPTCHA' });
  }
};

