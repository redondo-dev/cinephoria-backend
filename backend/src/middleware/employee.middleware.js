export const isEmployee = (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise.'
      });
    }

    // Vérifier le rôle de l'utilisateur
    if (req.user.role !== 'employe' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être employé pour accéder à cette ressource.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions.'
    });
  }
};

export const logIntranetAccess = async (req, res, next) => {
  try {
    console.log(`[INTRANET] ${req.user.email} a accédé à ${req.method} ${req.originalUrl}`);
   
    next();
  } catch (error) {
    next(); 
  }
};