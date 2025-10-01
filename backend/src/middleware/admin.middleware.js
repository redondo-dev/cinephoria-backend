// src/middleware/admin.middleware.js
export function isAdmin(req, res, next) {
  try {
    // req.user est défini par authMiddleware (décodage JWT)
    if (req.user && req.user.role === "admin") {
      return next();
    }
    return res.status(403).json({ message: "Accès interdit : admin requis" });
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}
