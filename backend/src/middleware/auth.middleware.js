// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ============================================
// 1. AUTHENTIFICATION DE BASE
// ============================================
export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Accès refusé. Token manquant." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role: decoded.role,
      isConfirmed: user.isConfirmed,
      mustChangePassword: user.mustChangePassword
    };

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalide" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expiré" });
    }
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ============================================
// 2. VÉRIFICATIONS SUPPLÉMENTAIRES
// ============================================
export const requireConfirmedAccount = (req, res, next) => {
  if (!req.user?.isConfirmed) {
    return res.status(403).json({ 
      message: "Compte non confirmé. Veuillez vérifier votre email." 
    });
  }
  next();
};

export const checkMustChangePassword = (req, res, next) => {
  if (req.user?.mustChangePassword) {
    return res.status(403).json({ 
      message: "Vous devez changer votre mot de passe temporaire avant de continuer",
      mustChangePassword: true
    });
  }
  next();
};

// ============================================
// 3. AUTORISATION PAR RÔLE
// ============================================
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }

      const hasRoleById = allowedRoles.includes(req.user.role_id);
      const hasRoleByName = allowedRoles
        .map(r => String(r).toUpperCase())
        .includes(String(req.user.role).toUpperCase());

      if (!hasRoleById && !hasRoleByName) {
        return res.status(403).json({
          message: `Accès refusé. Rôles autorisés: ${allowedRoles.join(", ")}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la vérification des permissions",
        error: error.message
      });
    }
  };
};

// ============================================
// 4. MIDDLEWARES SPÉCIFIQUES
// ============================================
export const isAdmin = authorizeRoles(2, "ADMIN");
export const isEmploye = authorizeRoles(3, "EMPLOYE");
export const isClient = authorizeRoles(1, "CLIENT");
export const isVisiteur = authorizeRoles(4, "VISITEUR");

// ============================================
// 5. COMBINAISONS
// ============================================
export const isAdminOrEmploye = authorizeRoles(2, 3, "ADMIN", "EMPLOYE");

// ============================================
// 6. ALIAS (pour compatibilité)
// ============================================
export const verifyToken = authenticate;