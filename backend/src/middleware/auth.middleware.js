import jwt from "jsonwebtoken";

 export const verifyToken = (req, res, next) => {
 
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Accès refusé" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalide" });
  }
};
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
       try {
      if (!req.user) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      const userRole = req.user.role?.toUpperCase();
      const normalizedRoles = allowedRoles.map(r => r.toUpperCase());

 if (!normalizedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Accès refusé. Rôle requis: ${allowedRoles.join(', ')}`
        });
      }


      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions.',
        error: error.message
      });
    }
  };
};


export const checkMustChangePassword = (req, res, next) => {
  if (req.user.mustChangePassword) {
    return res.status(403).json({ 
      message: "Vous devez changer votre mot de passe temporaire avant de continuer" 
    });
  }
  next();
};
