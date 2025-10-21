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

 if (req.user.role !== 'employe' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être employé pour accéder à cette ressource.'
      });
    }



      // if (!req.user || !allowedRoles.includes(req.user.role)) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
      //   });
      // }

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
