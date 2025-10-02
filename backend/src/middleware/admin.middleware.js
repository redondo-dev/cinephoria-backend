// src/middleware/admin.middleware.js
export function isAdmin(req, res, next) {

  console.log("Role détecté dans le token :", req.user?.role_id);
  try {
    // req.user est défini par authMiddleware (décodage JWT)
    if (req.user?.role_id !== 2)
   
    return res.status(403).json({ message: "Accès interdit : admin requis" });
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
  next();
}

