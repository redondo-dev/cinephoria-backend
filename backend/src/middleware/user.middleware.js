// middleware/user.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const isClient = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token manquant ou invalide' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier si le compte est confirmé
    if (!user.isConfirmed) {
      return res.status(403).json({ 
        error: 'Compte non confirmé. Veuillez vérifier votre email.' 
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré' 
      });
    }
    
    console.error('Erreur middleware isClient:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de la vérification de l\'authentification' 
    });
  }
};

export default isClient;