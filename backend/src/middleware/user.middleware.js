/ middleware/isClient.js
import { verify } from 'jsonwebtoken';
import { findById } from '../models/User';

/**
 * Middleware pour vérifier que l'utilisateur est un client
 */
export const isClient = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Authentification requise.'
      });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const user = await findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    if (user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être client pour accéder à cet espace.'
      });
    }

    if (user.statut !== 'actif') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est inactif.'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions.'
    });
  }
};


